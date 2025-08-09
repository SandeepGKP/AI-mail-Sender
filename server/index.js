const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Store Gmail credentials in memory
let globalSenderEmail = null;
let globalSenderPassword = null;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100
});
app.use(limiter);

// CORS configuration
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Setup Gmail, generate, and send in one
app.post('/api/setup-gmail', async (req, res) => {
  try {
    const { email, appPassword, prompt, tone = 'professional', length = 'medium', to, subject } = req.body;

    if (!email || !appPassword) {
      return res.status(400).json({ error: 'Email and app password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (appPassword.length !== 16) {
      return res.status(400).json({ error: 'App password should be 16 characters' });
    }
    if (!prompt || !to || !subject) {
      return res.status(400).json({ error: 'Prompt, to, and subject are required' });
    }

    // Save in memory
    globalSenderEmail = email;
    globalSenderPassword = appPassword;

    // Generate email content
    const systemPrompt = `You are a professional email writer. Generate a ${tone} email based on the following prompt. The email should be ${length} in length and follow proper email etiquette. Return only the email content without any additional formatting or explanations.`;
    const generatedEmail = await generateWithGroq(systemPrompt, prompt);

    // Create transporter
    const mailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: globalSenderEmail, pass: globalSenderPassword }
    });

    // Send email
    const mailOptions = {
      from: globalSenderEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: generatedEmail.replace(/\n/g, '<br>'),
      text: generatedEmail
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('📤 Email sent:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      recipients: Array.isArray(to) ? to : [to],
      emailContent: generatedEmail
    });

  } catch (error) {
    console.error('❌ Error in setup-gmail sequence:', error);
    res.status(500).json({ error: 'Failed to configure, generate, and send email', details: error.message });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
