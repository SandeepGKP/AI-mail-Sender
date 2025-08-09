import React from 'react';
import { CheckCircle, Mail, Users, Clock } from 'lucide-react';

const SuccessModal = ({ onReset, emailData }) => {
  const handlePrint = () => {
    try {
      const source = document.getElementById('print-receipt');
      const html = source ? source.innerHTML : '';
      const w = window.open('', '_blank');
      if (!w) return window.print();
      w.document.open();
      w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
        <style>
          @page { margin: 12mm; }
          * { box-sizing: border-box; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; background: #fff; }
          .limit { max-height: 10.5in; overflow: hidden; }
          /* Headings */
          h2 { margin: 0 0 8px; font-size: 24px; line-height: 1.2; font-weight: 700; }
          h4 { margin: 0 0 6px; font-size: 14px; font-weight: 600; }
          /* Utilities */
          .text-center { text-align: center; }
          .mb-2 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          .p-8 { padding: 24px; }
          .px-4 { padding-left: 16px; padding-right: 16px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .rounded-lg { border-radius: 12px; }
          .rounded-full { border-radius: 9999px; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .grid { display: grid; }
          .grid-cols-1 { grid-template-columns: 1fr; }
          .gap-4 { gap: 16px; }
          .space-y-6 > * + * { margin-top: 24px; }
          /* Colors */
          .text-white { color: #ffffff; }
          .text-green-100 { color: #dcfce7; }
          .text-blue-700 { color: #1d4ed8; }
          .text-blue-800 { color: #1e40af; }
          .text-blue-900 { color: #1e3a8a; }
          .text-purple-700 { color: #6d28d9; }
          .text-gray-900 { color: #0f172a; }
          /* Background blocks */
          .bg-gradient-to-r { background-image: linear-gradient(90deg, var(--tw-gradient-from), var(--tw-gradient-to)); }
          .from-green-600 { --tw-gradient-from: #16a34a; }
          .to-emerald-600 { --tw-gradient-to: #059669; }
          .bg-blue-50 { background: #eff6ff; }
          .bg-green-50 { background: #ecfdf5; }
          .bg-purple-50 { background: #f5f3ff; }
          .bg-gray-50 { background: #f9fafb; }
          .bg-white { background: #ffffff; }
          /* Card framing for print */
          .receipt-card { border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); overflow: hidden; }
          .section { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fff; }
          /* Icon circle */
          .icon-circle { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.18); display: inline-flex; align-items: center; justify-content: center; }
          /* Pills */
          .pill { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
          /* Label */
          label { display: block; font-size: 12px; color: #334155; margin-bottom: 6px; font-weight: 600; }
          /* Hide non-essential sections in print */
          .bg-gradient-to-r.from-blue-50.to-purple-50 { display: none !important; } /* AI Settings Used */
          .bg-yellow-50.border.border-yellow-200 { display: none !important; }   /* What's Next? */
          .bg-gray-50.border-t.border-gray-200 { display: none !important; }    /* Action Buttons */
        </style>
      </head><body><div class="limit"><div class="receipt-card">${html}</div></div></body></html>`);
      w.document.close();
      w.focus();
      w.print();
      w.close();
    } catch (e) {
      window.print();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div id="print-receipt" className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Email Sent Successfully!</h2>
          <p className="text-green-100">Your AI-generated email has been delivered</p>
        </div>

        {/* Email Details */}
        <div className="p-8">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{emailData.recipients.length}</div>
                <div className="text-sm text-blue-700">Recipients</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{emailData.editedEmail.length}</div>
                <div className="text-sm text-green-700">Characters</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{new Date().toLocaleTimeString()}</div>
                <div className="text-sm text-purple-700">Sent At</div>
              </div>
            </div>

            {/* Email Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients:</label>
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
            </div>

            {/* AI Settings Used */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">AI Settings Used:</h4>
              <div className="flex space-x-4 text-sm">
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full">
                  Tone: {emailData.tone}
                </span>
                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full">
                  Length: {emailData.length}
                </span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Recipients should receive your email shortly</li>
                <li>• Check your sent folder for confirmation</li>
                <li>• Consider following up if needed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReset}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Send Another Email</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="btn-secondary flex-1"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Better Emails:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific in your prompts for better AI generation</li>
          <li>• Always review and edit AI-generated content</li>
          <li>• Use appropriate tone for your audience</li>
          <li>• Keep subject lines clear and concise</li>
        </ul>
      </div>
    </div>
  );
};

export default SuccessModal; 