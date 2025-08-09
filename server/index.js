const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Groq
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
async function generateWithGroq(systemPrompt, userPrompt) {
  if (!groq) throw new Error('GROQ_NOT_CONFIGURED');
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });
  return completion.choices[0].message.content;
}

// Store Gmail credentials in memory (no .env, no demo)
let gmailCredentials = { email: null, appPassword: null };

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Generate AI email
app.post('/api/generate-email', async (req, res) => {
  try {
    const { prompt, tone = 'professional', length = 'medium' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const systemPrompt = `You are a professional email writer. Generate a ${tone} email based on the following prompt. The email should be ${length} in length and follow proper email etiquette. Return only the email content without any additional formatting or explanations.`;

    if (!groq) {
      return res.status(400).json({ error: 'GROQ not configured' });
    }

    const generatedEmail = await generateWithGroq(systemPrompt, prompt);
    res.json({ success: true, email: generatedEmail, metadata: { tone, length, provider: 'groq' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate email', details: error.message });
  }
});

// Send email (always use credentials from /api/setup-gmail)
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, cc = [], bcc = [], subject, content, from, scheduledAt } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'To, subject, and content are required' });
    }

    if (!gmailCredentials.email || !gmailCredentials.appPassword) {
      return res.status(400).json({ error: 'Gmail not configured. Please set it up first.' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailCredentials.email, pass: gmailCredentials.appPassword }
    });

    const mailOptions = {
      from: gmailCredentials.email,
      replyTo: from && from !== gmailCredentials.email ? from : undefined,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: Array.isArray(cc) ? cc.join(', ') : cc,
      bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
      subject,
      html: content.replace(/\n/g, '<br>'),
      text: content
    };

    if (scheduledAt) {
      const sendTime = new Date(scheduledAt).getTime();
      const delayMs = Math.max(0, sendTime - Date.now());
      setTimeout(async () => {
        try {
          await transporter.sendMail(mailOptions);
        } catch (err) {
          console.error('❌ Scheduled send failed:', err);
        }
      }, delayMs);
      return res.json({ success: true, scheduled: true, scheduledAt });
    }

    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, messageId: info.messageId });

  } catch (error) {
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Validate email list
app.post('/api/validate-emails', (req, res) => {
  const { emails } = req.body;
  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Emails array is required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = emails.filter(e => emailRegex.test(e));
  const invalidEmails = emails.filter(e => !emailRegex.test(e));
  res.json({ success: true, validEmails, invalidEmails });
});

// Check Gmail config
app.get('/api/check-gmail-config', (req, res) => {
  const isConfigured = !!(gmailCredentials.email && gmailCredentials.appPassword);
  res.json({ success: true, configured: isConfigured });
});

// Setup Gmail credentials in memory
app.post('/api/setup-gmail', (req, res) => {
  const { email, appPassword } = req.body;

  if (!email || !appPassword) {
    return res.status(400).json({ error: 'Email and app password are required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (appPassword.length !== 16) {
    return res.status(400).json({ error: 'App password should be 16 characters' });
  }

  gmailCredentials.email = email;
  gmailCredentials.appPassword = appPassword;

  res.json({ success: true, message: 'Gmail configured successfully', email });
});

// Error handler
app.use((error, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
