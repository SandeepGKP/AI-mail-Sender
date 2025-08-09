import React, { useState } from 'react';
import { ArrowLeft, Send, Eye, Save, RotateCcw } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import toast from 'react-hot-toast';

const EmailEditor = ({ emailData, onEmailEdited, onSendEmail, isSending, onBack }) => {
  const [editedContent, setEditedContent] = useState(emailData.editedEmail);
  const [showPreview, setShowPreview] = useState(false);
  const [showGmailSetup, setShowGmailSetup] = useState(false);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    onEmailEdited(newContent);
  };

  const handleRegenerate = () => {
    // This would trigger a new generation with the same prompt
    toast.success('Regeneration feature coming soon!');
  };

  const handleSaveDraft = () => {
    // Save to localStorage for now
    localStorage.setItem('emailDraft', JSON.stringify({
      ...emailData,
      editedEmail: editedContent,
      timestamp: new Date().toISOString()
    }));
    toast.success('Draft saved successfully!');
  };

  const handleSend = async () => {
    if (!editedContent.trim()) {
      toast.error('Email content cannot be empty');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/send-email', {
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
            ? `${editedContent}\n\n${emailData.signature}`
            : editedContent,
          scheduledAt: emailData.scheduledAt || undefined
        }),
      });
      
      const result = await response.json();
      
      if (result.demo) {
        setShowGmailSetup(true);
        return;
      }
      
      if (result.success) {
        onSendEmail();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Form</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            className="btn-secondary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          
          <button
            onClick={handleRegenerate}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Regenerate</span>
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From:</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {emailData.from || 'Not set'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
                <div className="flex flex-wrap gap-2">
                  {emailData.recipients.map((email, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {emailData.subject}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Settings:</label>
                <div className="flex space-x-4 text-sm">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                    Tone: {emailData.tone}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    Length: {emailData.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Original Prompt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Prompt</h3>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
              {emailData.prompt}
            </div>
          </div>
        </div>

        {/* Email Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Email Content</h3>
              <div className="text-sm text-gray-500">
                {editedContent.length} characters
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={async () => {
                  const resp = await fetch('http://localhost:5000/api/rewrite-email', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: editedContent, action: 'shorten', tone: emailData.tone })
                  });
                  const data = await resp.json();
                  if (data.success) {
                    setEditedContent(data.content);
                    onEmailEdited(data.content);
                  }
                }}
                className="btn-secondary"
              >Shorten</button>

              <button
                onClick={async () => {
                  const resp = await fetch('http://localhost:5000/api/rewrite-email', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: editedContent, action: 'expand', tone: emailData.tone })
                  });
                  const data = await resp.json();
                  if (data.success) {
                    setEditedContent(data.content);
                    onEmailEdited(data.content);
                  }
                }}
                className="btn-secondary"
              >Expand</button>

              <button
                onClick={async () => {
                  const resp = await fetch('http://localhost:5000/api/rewrite-email', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: editedContent, action: 'formalize', tone: 'formal' })
                  });
                  const data = await resp.json();
                  if (data.success) {
                    setEditedContent(data.content);
                    onEmailEdited(data.content);
                  }
                }}
                className="btn-secondary"
              >Formalize</button>
            </div>
            
            <TextareaAutosize
              value={editedContent}
              onChange={handleContentChange}
              placeholder="Edit your email content here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[400px]"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            />
            
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="datetime-local"
                  value={emailData.scheduledAt}
                  onChange={(e) => onEmailEdited(editedContent) || (emailData.scheduledAt = e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Schedule send (optional)"
                />
                <input
                  type="text"
                  value={emailData.signature}
                  onChange={(e) => { localStorage.setItem('emailSignature', e.target.value); emailData.signature = e.target.value; }}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Signature (saved locally)"
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={emailData.includeSignature} onChange={(e) => { emailData.includeSignature = e.target.checked; }} />
                  Include signature
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={isSending || !editedContent.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isSending ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <strong>To:</strong> {emailData.recipients.join(', ')}
                </div>
                <div>
                  <strong>Subject:</strong> {emailData.subject}
                </div>
                <div className="border-t pt-4">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {editedContent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gmail Setup Modal */}
      {showGmailSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Setup Gmail for Real Email Sending</h3>
                <button
                  onClick={() => setShowGmailSetup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 To send real emails, follow these steps:</h4>
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

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">🔧 Then configure the server:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                    <li><strong>Create a file named ".env"</strong> in the "server" folder</li>
                    <li><strong>Add these lines:</strong></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">EMAIL_USER=your-gmail@gmail.com</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">EMAIL_PASS=your-16-character-app-password</code></li>
                    <li><strong>Restart the server:</strong> <code className="bg-gray-100 px-2 py-1 rounded">cd server && npm run dev</code></li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    <li>Use your actual Gmail address (not a placeholder)</li>
                    <li>The app password is 16 characters without spaces</li>
                    <li>Don't use your regular Gmail password</li>
                    <li>Check Spam folder if emails don't appear in inbox</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowGmailSetup(false)}
                    className="btn-secondary"
                  >
                    Got it, I'll set it up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailEditor; 