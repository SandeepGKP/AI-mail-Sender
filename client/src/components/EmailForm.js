import React, { useState } from 'react';
import { UserPlus, Sparkles, Users, FileText, MessageSquare, CopyPlus, Calendar, CornerDownRight, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = 'https://ai-mail-sender-server.onrender.com';

const EmailForm = ({ emailData, setEmailData, onEmailGenerated, isGenerating, setIsGenerating }) => {
  const [newRecipient, setNewRecipient] = useState('');
  const [emailValidation, setEmailValidation] = useState({});
  const [showGmailSetup, setShowGmailSetup] = useState(false);
  const [gmailSetupStep, setGmailSetupStep] = useState(1);
  const [gmailCredentials, setGmailCredentials] = useState({ email: '', appPassword: '' });


  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    
    const email = newRecipient.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (emailData.recipients.includes(email)) {
      toast.error('This email is already added');
      return;
    }
    
    setEmailData(prev => ({
      ...prev,
      recipients: [...prev.recipients, email]
    }));
    setNewRecipient('');
  };

  const removeRecipient = (emailToRemove) => {
    setEmailData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(email => email !== emailToRemove)
    }));
  };

  const validateEmails = async () => {
    if (emailData.recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return false;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/validate-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailData.recipients }),
      });
      
      const result = await response.json();
      
      if (result.invalidEmails.length > 0) {
        toast.error(`Invalid emails: ${result.invalidEmails.join(', ')}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating emails:', error);
      return true; // Continue if validation fails
    }
  };

  const generateEmail = async () => {
    if (!emailData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    
    if (!emailData.prompt.trim()) {
      toast.error('Please enter a prompt for the email');
      return;
    }
    
    const isValid = await validateEmails();
    if (!isValid) return;
    
    // Check if Gmail is configured
    try {
      const response = await fetch(`${API_BASE}/api/check-gmail-config`);
      const result = await response.json();
      if (!result.configured) {
        setShowGmailSetup(true);
        return;
      }
    } catch (error) {
      setShowGmailSetup(true);
      return;
    }
    
    setIsGenerating(true);
    
    const fallbackFromPrompt = () => {
      const body = `I hope this message finds you well. ${emailData.prompt}\n\nPlease let me know if you have any questions or would like to discuss further.`;
      return `Dear [Recipient],\n\n${body}\n\nBest regards,\n[Your Name]`;
    };

    try {
      const response = await fetch(`${API_BASE}/api/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: emailData.prompt,
          tone: emailData.tone,
          length: emailData.length
        }),
      });
      
      const result = await response.json();
      
      if (result && result.success && result.email) {
        onEmailGenerated(result.email);
        toast.success('Email generated successfully!');
      } else if (result && result.email) {
        // Backend returned an email but not success
        onEmailGenerated(result.email);
        toast('Using fallback email from server');
      } else {
        const fallback = fallbackFromPrompt();
        onEmailGenerated(fallback);
        toast('Using local fallback email');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      const fallback = fallbackFromPrompt();
      onEmailGenerated(fallback);
      toast('Using local fallback email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGmailSetup = async () => {
    if (!gmailCredentials.email || !gmailCredentials.appPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/setup-gmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gmailCredentials),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Gmail configured successfully!');
        setShowGmailSetup(false);
        setGmailSetupStep(1);
        setGmailCredentials({ email: '', appPassword: '' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error setting up Gmail:', error);
      toast.error('Failed to configure Gmail. Please try again.');
    }
  };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRecipient();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Email</h2>
        <p className="text-lg text-gray-600">Choose between AI generation or manual writing</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setEmailData(prev => ({ ...prev, mode: 'ai' }))}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              emailData.mode === 'ai'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            AI Generated
          </button>
          <button
            onClick={() => setEmailData(prev => ({ ...prev, mode: 'manual' }))}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              emailData.mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PenTool className="w-4 h-4 inline mr-2" />
            Manual Write
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* From (Sender) Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Sender</h3>
            </div>
            <input
              type="email"
              value={emailData.from}
              onChange={(e) => setEmailData(prev => ({ ...prev, from: e.target.value }))}
              placeholder="Enter sender email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Recipients Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              {emailData.recipients.length > 0 && (
                <div className="space-y-2">
                  {emailData.recipients.map((email, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => removeRecipient(email)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CC/BCC Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CornerDownRight className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">CC / BCC</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={emailData.cc.join(', ')}
                onChange={(e) => setEmailData(prev => ({ ...prev, cc: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                placeholder="CC (comma separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                value={emailData.bcc.join(', ')}
                onChange={(e) => setEmailData(prev => ({ ...prev, bcc: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                placeholder="BCC (comma separated)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subject Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Subject Line</h3>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const resp = await fetch(`${API_BASE}/api/suggest-subject`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: emailData.prompt })
                    });
                    const data = await resp.json();
                    if (data.success && data.subjects?.length) {
                      setEmailData(prev => ({ ...prev, subject: data.subjects[0] }));
                      toast.success('Suggested subject applied');
                    } else {
                      toast.error('Could not get suggestions');
                    }
                  } catch (e) {
                    toast.error('Suggestion failed');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Suggest
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - AI Settings or Manual Content */}
        <div className="space-y-6">
          {emailData.mode === 'ai' ? (
            <>
              {/* Prompt Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Email Prompt</h3>
                </div>
                
                <textarea
                  value={emailData.prompt}
                  onChange={(e) => setEmailData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe what you want in your email. For example: 'Write a follow-up email to a client about our recent meeting discussing project timeline and next steps'"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* AI Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Settings</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                    <select
                      value={emailData.tone}
                      onChange={(e) => setEmailData(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                      <option value="persuasive">Persuasive</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                    <select
                      value={emailData.length}
                      onChange={(e) => setEmailData(prev => ({ ...prev, length: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Manual Content Section */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <PenTool className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Email Content</h3>
              </div>
              
              <textarea
                value={emailData.editedEmail}
                onChange={(e) => setEmailData(prev => ({ ...prev, editedEmail: e.target.value }))}
                placeholder="Write your email content here..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8 text-center">
        {emailData.mode === 'ai' ? (
          <button
            onClick={generateEmail}
            disabled={isGenerating}
            className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <div className="loading-spinner"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Email</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              if (!emailData.editedEmail.trim()) {
                toast.error('Please write your email content');
                return;
              }
              onEmailGenerated(emailData.editedEmail);
            }}
            className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
          >
            <PenTool className="w-5 h-5" />
            <span>Continue to Editor</span>
          </button>
        )}
      </div>

      {/* Gmail Setup Wizard */}
      {showGmailSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Setup Gmail for Email Sending</h3>
                <button
                  onClick={() => setShowGmailSetup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {gmailSetupStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📧 Step 1: Get Gmail App Password</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li><strong>Go to your Gmail account</strong> (gmail.com)</li>
                      <li><strong>Click your profile picture</strong> → <strong>Manage your Google Account</strong></li>
                      <li><strong>Go to Security</strong> (left sidebar)</li>
                      <li><strong>Enable 2-Step Verification</strong> (if not already enabled)</li>
                      <li><strong>Go back to Security</strong> → <strong>App passwords</strong></li>
                      <li><strong>Select "Mail"</strong> from the dropdown</li>
                      <li><strong>Click "Generate"</strong></li>
                      <li><strong>Copy the 16-character password</strong> (no spaces)</li>
                    </ol>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setGmailSetupStep(2)}
                      className="btn-primary"
                    >
                      I have my app password
                    </button>
                  </div>
                </div>
              )}

              {gmailSetupStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">🔧 Step 2: Enter Your Gmail Credentials</h4>
                    <p className="text-sm text-green-800 mb-4">We'll automatically configure the server for you.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gmail Address</label>
                      <input
                        type="email"
                        value={gmailCredentials.email}
                        onChange={(e) => setGmailCredentials(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your-gmail@gmail.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">App Password (16 characters)</label>
                      <input
                        type="password"
                        value={gmailCredentials.appPassword}
                        onChange={(e) => setGmailCredentials(prev => ({ ...prev, appPassword: e.target.value }))}
                        placeholder="Enter your 16-character app password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                      <li>Use your actual Gmail address (not a placeholder)</li>
                      <li>The app password is 16 characters without spaces</li>
                      <li>Don't use your regular Gmail password</li>
                      <li>Your credentials are stored securely on your local server only</li>
                    </ul>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setGmailSetupStep(1)}
                      className="btn-secondary"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGmailSetup}
                      className="btn-primary"
                    >
                      Configure Gmail
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailForm; 