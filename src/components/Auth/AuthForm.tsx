import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

// Google icon component
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export const AuthForm: React.FC = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { signInWithMagicLink, signInWithGoogle, isDevMode } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    setError(null);
    try {
      await signInWithMagicLink(data.email);
      setMagicLinkSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.error'));
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.googleError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F2F4F7' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8" style={{ borderTop: '4px solid #2FA5A9' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1E2A38' }}>{t('auth.brand')}</h1>
          <p className="text-sm" style={{ color: '#1E2A38', opacity: 0.7 }}>
            {t('auth.tagline')}
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 mb-6 border-2"
          style={{
            borderColor: '#E5E7EB',
            backgroundColor: 'white',
            color: '#1E2A38'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
            e.currentTarget.style.borderColor = '#D1D5DB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#E5E7EB';
          }}
        >
          <GoogleIcon className="w-5 h-5" />
          {t('auth.continueWithGoogle')}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('auth.orSignInWithEmail')}</span>
          </div>
        </div>

        {magicLinkSent ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-green-800">
                  {t('auth.magicLinkSent')}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {t('auth.magicLinkInstructions')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-sm transition-colors"
              style={{ color: '#2FA5A9' }}
            >
              {t('auth.sendAnotherLink')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {isDevMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <span className="text-sm text-yellow-700">
                  <strong>{t('auth.devMode')}</strong> {t('auth.devModeDescription')}
                </span>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 font-medium" style={{ color: '#1E2A38' }}>{t('auth.email')}</label>
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
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(47, 165, 169, 0.1)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
              {isSubmitting ? t('auth.sending') : t('auth.sendMagicLink')}
            </button>

            <p className="text-xs text-center text-gray-500 mt-2">
              {t('auth.emailFooter')}
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
