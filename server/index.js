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

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://ai-mail-sender.onrender.com'
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
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

// Initialize Groq (required)
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

// Email transporter (Gmail)
let transporter = null;
function createTransporter(user, pass) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });
}

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
      process.env.EMAIL_USER !== 'your-email@gmail.com' && 
      process.env.EMAIL_PASS !== 'your-app-password' &&
      process.env.EMAIL_USER !== 'your-real-gmail@gmail.com' &&
      process.env.EMAIL_PASS !== 'your-gmail-app-password') {
    transporter = createTransporter(process.env.EMAIL_USER, process.env.EMAIL_PASS);
    console.log('📧 Email configuration set up successfully with:', process.env.EMAIL_USER);
  } else {
    console.log('📧 Email configuration not set up. Running in DEMO MODE.');
    console.log('📧 To send real emails, create server/.env with:');
    console.log('📧 EMAIL_USER=your-actual-gmail@gmail.com');
    console.log('📧 EMAIL_PASS=your-16-character-app-password');
  }
} catch {
  console.warn('Email configuration error. Running in DEMO MODE.');
  transporter = null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Generate AI email (Groq only)
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
    const { to, cc = [], bcc = [], subject, content, from, scheduledAt, oauth2 } = req.body;
    console.log('📧 Send email request received:', { to, subject, from, contentLength: content?.length });

    if (!to || !subject || !content) {
      console.log('❌ Missing required fields:', { to: !!to, subject: !!subject, content: !!content });
      return res.status(400).json({ error: 'To, subject, and content are required' });
    }

    let mailTransporter = transporter;
    if (oauth2 && oauth2.clientId && oauth2.clientSecret && oauth2.refreshToken && oauth2.user) {
      // Use OAuth2 for this request
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

    // Check if email transporter is configured
    if (!mailTransporter) {
      // Demo mode - simulate successful email sending
      console.log('🎭 DEMO MODE: Email would be sent with the following details:');
      console.log('From:', from || 'demo@example.com');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content length:', content.length);
      
      return res.json({
        success: true,
        messageId: 'demo-message-id-' + Date.now(),
        recipients: Array.isArray(to) ? to : [to],
        timestamp: new Date().toISOString(),
        demo: true,
        message: 'Email sent in demo mode (no actual email sent)'
      });
    }

    // Validate email addresses
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

    const authUser = oauth2?.user || process.env.EMAIL_USER; // changed to use updated in-memory credentials
    const mailOptions = {
      from: authUser, // Gmail requires authenticated sender
      replyTo: from && from !== authUser ? from : undefined,
      to: recipients.join(', '),
      cc: ccList.length ? ccList.join(', ') : undefined,
      bcc: bccList.length ? bccList.join(', ') : undefined,
      subject: subject,
      html: content.replace(/\n/g, '<br>'),
      text: content,
      headers: {
        'Message-ID': `<${Date.now()}-${Math.floor(Math.random()*1e6)}@${authUser.split('@')[1]}>`
      }
    };

    // Handle scheduled sending
    if (scheduledAt) {
      const sendTime = new Date(scheduledAt).getTime();
      const delayMs = Math.max(0, sendTime - Date.now());
      setTimeout(async () => {
        try {
          const info = await mailTransporter.sendMail(mailOptions);
          console.log('📤 Scheduled email sent:', info.messageId);
        } catch (err) {
          console.error('❌ Scheduled send failed:', err);
        }
      }, delayMs);
      return res.json({
        success: true,
        scheduled: true,
        scheduledAt,
        recipients,
        timestamp: new Date().toISOString()
      });
    }

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('📤 Email sent successfully:', info.messageId);
    console.log('📤 To:', recipients);
    console.log('📤 Subject:', subject);

    res.json({
      success: true,
      messageId: info.messageId,
      recipients: recipients,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error stack:', error.stack);
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
    const validationResults = emails.map(email => ({
      email,
      isValid: emailRegex.test(email)
    }));

    const validEmails = validationResults.filter(result => result.isValid).map(result => result.email);
    const invalidEmails = validationResults.filter(result => !result.isValid).map(result => result.email);

    res.json({
      success: true,
      validEmails,
      invalidEmails,
      totalValid: validEmails.length,
      totalInvalid: invalidEmails.length
    });

  } catch (error) {
    console.error('Error validating emails:', error);
    res.status(500).json({ error: 'Failed to validate emails' });
  }
});

// Suggest subject lines
app.post('/api/suggest-subject', async (req, res) => {
  try {
    const { prompt, emailContent = '' } = req.body;
    if (!prompt && !emailContent) {
      return res.status(400).json({ error: 'Provide prompt or emailContent' });
    }

    const baseInstruction = 'Generate 3 concise, compelling, professional email subject lines. Return as a JSON array of strings only.';

    if (!groq) {
      return res.json({
        success: true,
        subjects: [
          'Quick Follow-Up on Our Recent Discussion',
          'Next Steps Regarding ' + (prompt || 'Your Request'),
          'Circle Back: ' + (prompt || 'Open Items')
        ],
        demo: true
      });
    }

    const response = await generateWithGroq(baseInstruction, `${prompt || ''}\n\n${emailContent}`);

    let subjects;
    try {
      subjects = JSON.parse(response);
    } catch {
      subjects = response.split('\n').filter(Boolean).slice(0,3);
    }

    res.json({ success: true, subjects });
  } catch (error) {
    console.error('❌ Error suggesting subject:', error);
    res.status(500).json({ error: 'Failed to suggest subject', details: error.message });
  }
});

// Rewrite email content
app.post('/api/rewrite-email', async (req, res) => {
  try {
    const { content, action = 'improve', tone = 'professional', length = 'medium' } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const instruction = `Rewrite the email content to ${action}. Keep the tone ${tone} and target a ${length} length. Return only the rewritten email.`;

    if (!groq) {
      let rewritten = content;
      if (action === 'shorten') rewritten = content.split('\n').slice(0, Math.ceil(content.split('\n').length/2)).join('\n');
      if (action === 'expand') rewritten = content + '\n\nAdditional details: [Add specifics here].';
      if (action === 'formalize') rewritten = 'Dear [Recipient],\n\n' + content + '\n\nSincerely,\n[Your Name]';
      return res.json({ success: true, content: rewritten, demo: true });
    }

    const response = await generateWithGroq(instruction, content);

    const rewritten = response;
    res.json({ success: true, content: rewritten });
  } catch (error) {
    console.error('❌ Error rewriting email:', error);
    res.status(500).json({ error: 'Failed to rewrite email', details: error.message });
  }
});

// Check Gmail configuration
app.get('/api/check-gmail-config', (req, res) => {
  try {
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && 
      process.env.EMAIL_USER !== 'your-email@gmail.com' && 
      process.env.EMAIL_PASS !== 'your-app-password' &&
      process.env.EMAIL_USER !== 'your-real-gmail@gmail.com' &&
      process.env.EMAIL_PASS !== 'your-gmail-app-password');
    
    res.json({ 
      success: true, 
      configured: isConfigured,
      hasUser: !!process.env.EMAIL_USER,
      hasPass: !!process.env.EMAIL_PASS
    });
  } catch (error) {
    console.error('❌ Error checking Gmail config:', error);
    res.status(500).json({ error: 'Failed to check Gmail configuration' });
  }
});

// Setup Gmail configuration (MODIFIED to avoid redeploys)
app.post('/api/setup-gmail', (req, res) => {
  try {
    const { email, appPassword } = req.body;
    
    if (!email || !appPassword) {
      return res.status(400).json({ error: 'Email and app password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate app password (should be 16 characters)
    if (appPassword.length !== 16) {
      return res.status(400).json({ error: 'App password should be 16 characters' });
    }

    // Store in memory instead of writing to .env
    process.env.EMAIL_USER = email;
    process.env.EMAIL_PASS = appPassword;

    // Recreate transporter instantly
    try {
      transporter = createTransporter(email, appPassword);
      console.log('📧 Gmail configured successfully with:', email);
    } catch (error) {
      console.error('❌ Error creating transporter:', error);
      return res.status(500).json({ error: 'Failed to configure Gmail transporter' });
    }

    res.json({ 
      success: true, 
      message: 'Gmail configured successfully',
      email: email
    });
  } catch (error) {
    console.error('❌ Error setting up Gmail:', error);
    res.status(500).json({ error: 'Failed to setup Gmail configuration' });
  }
});

// New endpoint: Accept OAuth2 credentials for Gmail
app.post('/api/gmail-oauth2-config', async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken, user } = req.body;
    if (!clientId || !clientSecret || !refreshToken || !user) {
      return res.status(400).json({ error: 'Missing OAuth2 credentials' });
    }
    // Test OAuth2 credentials by generating an access token
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oAuth2Client.getAccessToken();
    if (!token) throw new Error('Failed to get access token');
    res.json({ success: true, message: 'OAuth2 credentials valid', accessToken: token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
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
  console.log(`📧 AI Email Sender API ready`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
