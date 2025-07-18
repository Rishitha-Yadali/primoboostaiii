import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ForgotPasswordData } from '../../types/auth';

const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please enter a valid Gmail address')
    .refine((email) => email.endsWith('@gmail.com'), {
      message: 'Please use a Gmail address (@gmail.com)',
    }),
});

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onSuccess: (email: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onBackToLogin, 
  onSuccess 
}) => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(data);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(data.email);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Email Sent!</h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          We've sent a password reset link to <br />
          <strong className="text-gray-900">{getValues('email')}</strong>
        </p>
        <p className="text-gray-500 text-sm">
          Check your email and click the link to reset your password. You can close this window.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-gray-600 leading-relaxed">
          Enter your Gmail address and we'll send you a secure link to reset your password.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:scale-[0.98] shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending Reset Link...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send Reset Link</span>
            </>
          )}
        </button>

        {/* Back to Login */}
        <div className="text-center pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center justify-center space-x-2 mx-auto text-sm hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </form>
    </div>
  );
};