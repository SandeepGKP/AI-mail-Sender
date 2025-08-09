import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import EmailForm from './components/EmailForm';
import EmailEditor from './components/EmailEditor';
import EmailPreview from './components/EmailPreview';
import LoadingSpinner from './components/LoadingSpinner';
import SuccessModal from './components/SuccessModal';
import FooterInfo from './components/FooterInfo';

function App() {
  const [currentStep, setCurrentStep] = useState('form'); // form, editor, preview, success
  const [emailData, setEmailData] = useState({
    from: '',
    recipients: [],
    cc: [],
    bcc: [],
    subject: '',
    prompt: '',
    tone: 'professional',
    length: 'medium',
    generatedEmail: '',
    editedEmail: '',
    signature: '',
    includeSignature: false,
    scheduledAt: '',
    mode: 'ai' // 'ai' or 'manual'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleEmailGenerated = (generatedEmail) => {
    setEmailData(prev => ({
      ...prev,
      generatedEmail,
      editedEmail: generatedEmail
    }));
    setCurrentStep('editor');
  };

  const handleEmailEdited = (editedEmail) => {
    setEmailData(prev => ({
      ...prev,
      editedEmail
    }));
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const response = await fetch('https://ai-mail-sender-server.onrender.com/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from,
          to: emailData.recipients,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          content: emailData.includeSignature && emailData.signature
            ? `${emailData.editedEmail}\n\n${emailData.signature}`
            : emailData.editedEmail,
          scheduledAt: emailData.scheduledAt || undefined
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowSuccess(true);
        setCurrentStep('success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Handle error with toast notification
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setEmailData({
      from: '',
      recipients: [],
      cc: [],
      bcc: [],
      subject: '',
      prompt: '',
      tone: 'professional',
      length: 'medium',
      generatedEmail: '',
      editedEmail: '',
      signature: localStorage.getItem('emailSignature') || '',
      includeSignature: !!localStorage.getItem('emailSignature'),
      scheduledAt: '',
      mode: 'ai'
    });
    setCurrentStep('form');
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {currentStep === 'form' && (
          <EmailForm 
            emailData={emailData}
            setEmailData={setEmailData}
            onEmailGenerated={handleEmailGenerated}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        )}
        
        {currentStep === 'editor' && (
          <EmailEditor 
            emailData={emailData}
            onEmailEdited={handleEmailEdited}
            onSendEmail={handleSendEmail}
            isSending={isSending}
            onBack={() => setCurrentStep('form')}
          />
        )}
        
        {currentStep === 'preview' && (
          <EmailPreview 
            emailData={emailData}
            onSendEmail={handleSendEmail}
            isSending={isSending}
            onBack={() => setCurrentStep('editor')}
          />
        )}
        
        {currentStep === 'success' && (
          <SuccessModal 
            onReset={resetForm}
            emailData={emailData}
          />
        )}
      </main>

      <FooterInfo />
      
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-lg font-medium text-gray-700">Generating your email...</p>
            <p className="text-sm text-gray-500">This may take a few seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 