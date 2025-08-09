const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Groq = require('groq-sdk');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://ai-mail-sender.onrender.com'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Groq AI
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Generate AI email
app.post('/api/generate-email', async (req, res) => {
  try {
    const { prompt, tone = 'professional', length = 'medium' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const systemPrompt = `You are a professional email writer. Generate a ${tone} email based on the following prompt. The email should be ${length} in length and follow proper email etiquette.`;

    if (!groq) {
      return res.status(400).json({ error: 'GROQ not configured' });
    }

    const generatedEmail = await generateWithGroq(systemPrompt, prompt);
    return res.json({ success: true, email: generatedEmail });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate email', details: error.message });
  }
});

// Send email (always from credentials in request body)
app.post('/api/send-email', async (req, res) => {
  try {
    const { senderEmail, senderPassword, to, cc = [], bcc = [], subject, content, from, scheduledAt, oauth2 } = req.body;

    if (!senderEmail || !senderPassword) {
      return res.status(400).json({ error: 'Sender email and app password are required' });
    }
    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'To, subject, and content are required' });
    }

    // Create transporter with given credentials
    let mailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: senderEmail, pass: senderPassword }
    });

    // OAuth2 support if provided
    if (oauth2 && oauth2.clientId && oauth2.clientSecret && oauth2.refreshToken && oauth2.user) {
      mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: oauth2.user,
          clientId: oauth2.clientId,
          clientSecret: oauth2.clientSecret,
          refreshToken: oauth2.refreshToken,
        },
      });
    }

    // Validate recipients
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(to) ? to : [to];
    const ccList = Array.isArray(cc) ? cc : (cc ? [cc] : []);
    const bccList = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);
    const allToValidate = [...recipients, ...ccList, ...bccList];

    for (const email of allToValidate) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `Invalid email address: ${email}` });
      }
    }

    const mailOptions = {
      from: senderEmail,
      replyTo: from && from !== senderEmail ? from : undefined,
      to: recipients.join(', '),
      cc: ccList.length ? ccList.join(', ') : undefined,
      bcc: bccList.length ? bccList.join(', ') : undefined,
      subject: subject,
      html: content.replace(/\n/g, '<br>'),
      text: content
    };

    // Scheduled send
    if (scheduledAt) {
      const sendTime = new Date(scheduledAt).getTime();
      const delayMs = Math.max(0, sendTime - Date.now());
      setTimeout(async () => {
        try {
          await mailTransporter.sendMail(mailOptions);
        } catch (err) {
          console.error('❌ Scheduled send failed:', err);
        }
      }, delayMs);
      return res.json({ success: true, scheduled: true, scheduledAt });
    }

    // Send immediately
    const info = await mailTransporter.sendMail(mailOptions);
    res.json({
      success: true,
      messageId: info.messageId,
      recipients: recipients,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Validate email addresses
app.post('/api/validate-emails', (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter(e => emailRegex.test(e));
    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    res.json({ success: true, validEmails, invalidEmails });
  } catch {
    res.status(500).json({ error: 'Failed to validate emails' });
  }
});

// Gmail OAuth2 validation
app.post('/api/gmail-oauth2-config', async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken, user } = req.body;
    if (!clientId || !clientSecret || !refreshToken || !user) {
      return res.status(400).json({ error: 'Missing OAuth2 credentials' });
    }
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oAuth2Client.getAccessToken();
    if (!token) throw new Error('Failed to get access token');
    res.json({ success: true, message: 'OAuth2 credentials valid', accessToken: token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handler
app.use((error, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 AI Email Sender API ready`);
});
