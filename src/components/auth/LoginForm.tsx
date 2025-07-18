import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid Gmail address'),
  password: z.string().min(1, 'Password is required'),
});

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onForgotPassword, onClose }) => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      setIsSuccess(true);
      
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
        setIsSuccess(false);
      }, 1500);
    } catch (err) {
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials') || err.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before signing in.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Too many attempts. Please wait a moment and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-600">You have been signed in successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              {error.includes('Invalid email or password') && (
                <button 
                  type="button"
                  onClick={onForgotPassword}
                  className="text-red-600 text-xs mt-1 underline hover:no-underline"
                >
                  Forgot your password?
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Gmail Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              placeholder="your.email@gmail.com"
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white hover:border-gray-300'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white hover:border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline"
          >
            Forgot your password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center pt-6 border-t border-gray-100">
        <p className="text-gray-600 text-sm mb-3">
          Don't have an account yet?
        </p>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
        >
          Create your account →
        </button>
      </div>
    </div>
  );
};