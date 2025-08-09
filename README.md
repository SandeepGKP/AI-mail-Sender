# AI Email Sender - Professional Email Generator & Sender

A full-stack web application that uses AI to generate professional emails and send them to recipients. Built with React, Node.js, Express, and OpenAI.

## ✨ Features

- **AI-Powered Email Generation**: Generate professional emails using OpenAI's GPT model
- **Multiple Recipients**: Send emails to multiple recipients at once
- **Customizable Settings**: Choose tone (professional, friendly, formal, casual, persuasive) and length (short, medium, long)
- **Real-time Editing**: Edit AI-generated emails before sending
- **Email Validation**: Automatic validation of email addresses
- **Professional UI/UX**: Modern, responsive design with smooth animations
- **Preview Mode**: Preview emails before sending
- **Draft Saving**: Save email drafts for later use
- **Success Tracking**: Detailed success page with email statistics

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Gmail account (for sending emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Generated-email-sender
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Email Configuration (Gmail)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Server Configuration
   PORT=5000
   CLIENT_URL=http://localhost:3000
   
   # Security
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend (port 3000).

## 📧 How to Use

### 1. Add Recipients
- Enter email addresses in the recipients field
- Click "Add" or press Enter to add each recipient
- Invalid emails will be flagged automatically

### 2. Set Email Details
- Enter a subject line for your email
- Write a detailed prompt describing what you want in the email
- Choose the tone and length settings

### 3. Generate Email
- Click "Generate Email" to create AI-generated content
- Wait for the AI to process your request

### 4. Edit & Review
- Review the generated email in the editor
- Make any necessary edits or adjustments
- Use the preview feature to see how it will look

### 5. Send Email
- Click "Send Email" to deliver your message
- View the success page with delivery confirmation

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications
- **Framer Motion** - Smooth animations
- **React Textarea Autosize** - Auto-resizing text areas

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **OpenAI API** - AI email generation
- **Nodemailer** - Email sending
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

## 🔧 Configuration

### OpenAI Setup
1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add it to your `.env` file as `OPENAI_API_KEY`

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Add your Gmail and App Password to the `.env` file

### Alternative Email Providers
You can modify the email configuration in `server/index.js` to use other SMTP providers like:
- Outlook/Hotmail
- Yahoo Mail
- Custom SMTP servers

## 📁 Project Structure

```
AI-Generated-email-sender/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   ├── package.json
│   └── env.example        # Environment variables template
├── package.json           # Root package.json
└── README.md
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode Ready**: Easy to implement theme switching
- **Smooth Animations**: Framer Motion for delightful interactions
- **Loading States**: Clear feedback during AI generation and email sending
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation and screen reader support

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side email validation
- **CORS Protection**: Secure cross-origin requests
- **Helmet Security**: HTTP headers protection
- **Environment Variables**: Secure configuration management

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
```

### Backend (Heroku/Railway)
```bash
cd server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure your OpenAI API key is valid
4. Check your Gmail app password is correct

## 🔮 Future Enhancements

- [ ] Email templates library
- [ ] Scheduled email sending
- [ ] Email analytics and tracking
- [ ] Multi-language support
- [ ] Advanced AI settings
- [ ] Email signature management
- [ ] Contact management
- [ ] Email history and drafts
- [ ] Integration with CRM systems

---

**Built with ❤️ using modern web technologies** 