import React, { useState } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthView = 'login' | 'signup' | 'forgot-password' | 'success';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialView = 'login' 
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleSignupSuccess = () => {
    setCurrentView('success');
    setTimeout(() => {
      onClose();
      setCurrentView('login');
    }, 2500);
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentView('success');
    setTimeout(() => {
      onClose();
      setCurrentView('login');
    }, 100000);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Join Resume Optimizer';
      case 'forgot-password': return 'Reset Password';
      case 'success': return 'Success!';
      default: return 'Authentication';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8 border-b border-gray-100">
          <button
            onClick={handleCloseClick}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h1>
            <p className="text-gray-600 text-sm">
              {currentView === 'login' && 'Sign in to optimize your resume with AI'}
              {currentView === 'signup' && 'Create your account and start optimizing'}
              {currentView === 'forgot-password' && 'We\'ll help you reset your password'}
              {currentView === 'success' && 'Everything is set up perfectly!'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot-password')}
              onClose={onClose}
            />
          )}
          
          {currentView === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView('login')}
              onSignupSuccess={handleSignupSuccess}
            />
          )}
          
          {currentView === 'forgot-password' && (
            <ForgotPasswordForm
              onBackToLogin={() => setCurrentView('login')}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}
          
          {currentView === 'success' && (
            <div className="text-center py-8">
              <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">All Set!</h2>
              <p className="text-gray-600 leading-relaxed">
                {currentView === 'success' && currentView === 'signup' 
                  ? 'Your account has been created successfully. You can now start optimizing your resume!'
                  : 'Check your email for the password reset link.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};