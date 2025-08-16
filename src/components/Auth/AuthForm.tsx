import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { Lock, Mail, AlertCircle } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    console.log('Form submitted with:', data);
    setError(null);
    try {
      if (isSignUp) {
        console.log('Attempting signup...');
        await signUp(data.email, data.password);
      } else {
        console.log('Attempting signin...');
        await signIn(data.email, data.password);
      }
      console.log('Auth successful!');
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F2F4F7' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8" style={{ borderTop: '4px solid #2FA5A9' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1E2A38' }}>FINTONICO</h1>
          <p className="text-sm" style={{ color: '#1E2A38', opacity: 0.7 }}>
            Personal Finance Audit System
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm mb-2 font-medium" style={{ color: '#1E2A38' }}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2FA5A9' }} />
              <input
                {...register('email')}
                type="email"
                className="w-full pl-10 pr-3 py-2 rounded-lg border bg-white transition-all"
                style={{ 
                  borderColor: errors.email ? '#DC2626' : '#2FA5A9',
                  color: '#1E2A38'
                }}
                placeholder="Enter your email"
                autoComplete="email"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(47, 165, 169, 0.1)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium" style={{ color: '#1E2A38' }}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2FA5A9' }} />
              <input
                {...register('password')}
                type="password"
                className="w-full pl-10 pr-3 py-2 rounded-lg border bg-white transition-all"
                style={{ 
                  borderColor: errors.password ? '#DC2626' : '#2FA5A9',
                  color: '#1E2A38'
                }}
                placeholder="Enter your password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(47, 165, 169, 0.1)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: isSubmitting ? '#9CA3AF' : '#2FA5A9',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#268F92';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#2FA5A9';
              }
            }}
          >
            {isSubmitting
              ? 'Processing...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm transition-colors"
            style={{ color: '#2FA5A9' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#268F92'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#2FA5A9'}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};