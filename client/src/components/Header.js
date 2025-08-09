import React from 'react';
import { Mail, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Email Sender
              </h1>
              <p className="text-sm text-gray-600">Professional Email Generator & Sender</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Powered by AI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#help" className="text-gray-600 hover:text-blue-600 transition-colors">
                Help
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 