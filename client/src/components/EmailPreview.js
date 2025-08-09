import React from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

const EmailPreview = ({ emailData, onSendEmail, isSending, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Editor</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">Ready to Send</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Final Email Preview</h2>
          <p className="text-blue-100">Review your email before sending</p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From:</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {emailData.from || 'Not set'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients:</label>
                <div className="flex flex-wrap gap-2">
                  {emailData.recipients.map((email, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {emailData.subject}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Email Content:</label>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {emailData.editedEmail}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">AI Settings Used:</h4>
              <div className="flex space-x-4 text-sm">
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full">
                  Tone: {emailData.tone}
                </span>
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full">
                  Length: {emailData.length}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center">
              {emailData.editedEmail.length} characters
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{emailData.recipients.length}</span> recipient{emailData.recipients.length !== 1 ? 's' : ''} will receive this email
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onBack}
                className="btn-secondary"
              >
                Back to Edit
              </button>
              
              <button
                onClick={onSendEmail}
                disabled={isSending}
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

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important:</p>
            <p>Please review your email carefully before sending. Once sent, the email cannot be recalled.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview; 