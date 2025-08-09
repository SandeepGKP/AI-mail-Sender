const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const { google } = require('googleapis');
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

// Generate AI email
app.post('/api/generate-email', async (req, res) => {
  try {
    const { prompt, tone = 'professional', length = 'medium' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const systemPrompt = `You are a professional email writer. Generate a ${tone} email based on the following prompt. The email should be ${length} in length and follow proper email etiquette. Return only the email content without any additional formatting or explanations.`;

    if (!groq) {
      return res.status(400).json({ error: 'GROQ not configured', details: 'Set GROQ_API_KEY in server/.env' });
    }

    const generatedEmail = await generateWithGroq(systemPrompt, prompt);
    return res.json({ success: true, email: generatedEmail, metadata: { tone, length, provider: 'groq' } });
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: 'Failed to generate email', details: error.message });
  }
});

// Send email
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, cc = [], bcc = [], subject, content, from, scheduledAt, oauth2, senderEmail, senderPassword } = req.body;
    console.log('📧 Send email request received:', { to, subject, from, contentLength: content?.length });

    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'To, subject, and content are required' });
    }

    // Determine which credentials to use
    const finalSenderEmail = senderEmail || globalSenderEmail;
    const finalSenderPassword = senderPassword || globalSenderPassword;

    if (!finalSenderEmail || !finalSenderPassword) {
      return res.status(400).json({ error: 'No Gmail credentials provided. Please set up first.' });
    }

    // Create transporter
    let mailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: finalSenderEmail, pass: finalSenderPassword }
    });

    // OAuth2 handling
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

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(to) ? to : [to];
    const ccList = Array.isArray(cc) ? cc : (cc ? [cc] : []);
    const bccList = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);
    for (const email of [...recipients, ...ccList, ...bccList]) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `Invalid email address: ${email}` });
      }
    }

    const mailOptions = {
      from: finalSenderEmail,
      replyTo: from && from !== finalSenderEmail ? from : undefined,
      to: recipients.join(', '),
      cc: ccList.length ? ccList.join(', ') : undefined,
      bcc: bccList.length ? bccList.join(', ') : undefined,
      subject: subject,
      html: content.replace(/\n/g, '<br>'),
      text: content
    };

    // Scheduled sending
    if (scheduledAt) {
      const delayMs = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
      setTimeout(async () => {
        try {
          await mailTransporter.sendMail(mailOptions);
          console.log('📤 Scheduled email sent');
        } catch (err) {
          console.error('❌ Scheduled send failed:', err);
        }
      }, delayMs);
      return res.json({ success: true, scheduled: true, scheduledAt });
    }

    // Send immediately
    const info = await mailTransporter.sendMail(mailOptions);
    console.log('📤 Email sent:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      recipients,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Setup Gmail configuration (in-memory)
app.post('/api/setup-gmail', (req, res) => {
  try {
    const { email, appPassword } = req.body;
    if (!email || !appPassword) {
      return res.status(400).json({ error: 'Email and app password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (appPassword.length !== 16) {
      return res.status(400).json({ error: 'App password should be 16 characters' });
    }

    globalSenderEmail = email;
    globalSenderPassword = appPassword;
    console.log(`📧 Gmail credentials stored in memory for ${email}`);

    res.json({ success: true, message: 'Gmail configured successfully', email });
  } catch (error) {
    console.error('❌ Error setting up Gmail:', error);
    res.status(500).json({ error: 'Failed to setup Gmail configuration' });
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
