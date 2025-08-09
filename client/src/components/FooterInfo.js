import React from 'react';
import { CheckCircle2, Sparkles, Shield, Clock, Mail, SlidersHorizontal, HelpCircle, BookOpen, Bug, Keyboard } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white">
    <div className="mt-1 text-blue-600"><Icon className="w-5 h-5" /></div>
    <div>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-600">{desc}</div>
    </div>
  </div>
);

const FAQItem = ({ q, a }) => (
  <div className="p-4 rounded-lg border border-gray-200 bg-white">
    <div className="font-medium text-gray-900 mb-1">{q}</div>
    <div className="text-sm text-gray-600">{a}</div>
  </div>
);

const FooterInfo = () => {
  return (
    <div className="mt-16">
      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 max-w-6xl mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Features
          </h2>
          <p className="text-gray-600">Everything you need to generate and send professional emails efficiently.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureItem icon={CheckCircle2} title="AI Email Generation" desc="Crafts professional emails from your prompts with tone and length controls." />
          <FeatureItem icon={Mail} title="Multi-Recipient Support" desc="Send to multiple recipients with CC/BCC and proper validation." />
          <FeatureItem icon={SlidersHorizontal} title="Smart Editing Tools" desc="Rewrite helpers to shorten, expand, or formalize content in one click." />
          <FeatureItem icon={Clock} title="Schedule Send" desc="Pick a future time to deliver emails right on schedule." />
          <FeatureItem icon={Shield} title="Best Practices" desc="Authenticated sender with Reply-To, rate limiting, and security headers." />
          <FeatureItem icon={Keyboard} title="Great UX" desc="Responsive UI, auto-saving signature, previews, and clear feedback." />
        </div>
      </section>

      {/* Help Section */}
      <section id="help" className="container mx-auto px-4 max-w-6xl mb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Help & Guidance
          </h2>
          <p className="text-gray-600">Quick answers and tips for a smooth experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FAQItem q="How do I send real emails?" a={"Add EMAIL_USER (your Gmail) and EMAIL_PASS (Gmail App Password) in server/.env, restart the backend, then send. The From is your authenticated Gmail and the UI sender is set as Reply-To."} />
          <FAQItem q="Emails not landing in inbox?" a={"Start by sending to Gmail addresses, check Spam, use a clear subject, and avoid overly promotional language. Ensure your app password is correct."} />
          <FAQItem q="How do CC/BCC work?" a={"Enter comma-separated emails in CC/BCC. All addresses are validated before sending."} />
          <FAQItem q="What does Suggest do?" a={"It proposes professional subject lines based on your prompt. Pick or edit as needed."} />
          <FAQItem q="What does Rewrite do?" a={"You can Shorten, Expand or Formalize your email content with one click, keeping your tone preferences."} />
          <FAQItem q="Where is my signature stored?" a={"Your signature is saved only in your browser (localStorage) for convenience. Toggle Include to attach it."} />
        </div>

        <div className="mt-6 p-4 rounded-lg border border-indigo-200 bg-indigo-50 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="text-sm text-indigo-900">
            <div className="font-semibold">Tips</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Be specific in your prompt to get better AI results.</li>
              <li>Always preview and proofread before sending.</li>
              <li>Use Schedule Send for time-zone friendly delivery.</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50 flex items-start gap-3">
          <Bug className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-900">
            If something looks off, refresh the page, ensure the backend is running, and check the server console for logs.
          </div>
        </div>
      </section>
    </div>
  );
};

export default FooterInfo; 