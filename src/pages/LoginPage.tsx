import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MainLayout } from '../layouts/MainLayout';
import {
  loginWithEmail,
  loginWithGoogle,
  mapFirebaseAuthError,
} from '../services/authService';
import { loginSchema, type LoginFormValues } from '../validations/schemas';

export function LoginPage() {
  const { firebaseUser, authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (!authLoading && firebaseUser) {
    return <Navigate to={fromPath} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await loginWithEmail(values.email, values.password);
      showToast('Welcome back', 'success', 'Signed in to ReNest Campus.');
      navigate(fromPath, { replace: true });
    } catch (error) {
      const msg = mapFirebaseAuthError(error);
      setServerError(msg);
      showToast('Sign in failed', 'error', msg);
    }
  };

  const handleGoogleLogin = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      showToast('Welcome to ReNest Campus', 'success', 'Signed in with your Google account.');
      navigate(fromPath, { replace: true });
    } catch (error) {
      const msg = mapFirebaseAuthError(error);
      setServerError(msg);
      showToast('Google sign in failed', 'error', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#DDD7C9] bg-white p-8 shadow-xs">
          <h1 className="font-display text-2xl font-bold text-[#242B29]">
            Sign in to ReNest Campus
          </h1>
          <p className="mt-1.5 text-sm text-[#525C58]">
            Access your listings, buyer enquiries, favourites, and campus handovers.
          </p>

          {serverError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 leading-relaxed"
            >
              {serverError}
            </div>
          )}

          <div className="mt-6">
            <GoogleSignInButton
              label="Continue with Google"
              loading={googleLoading}
              disabled={isSubmitting}
              onClick={handleGoogleLogin}
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#DDD7C9]" />
            <span className="text-xs font-medium text-[#525C58]">or sign in with email</span>
            <div className="h-px flex-1 bg-[#DDD7C9]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#242B29]">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold text-[#242B29]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#174C3C] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className="w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 pr-10 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#525C58] hover:text-[#242B29]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 border-t border-[#EDE9DF] pt-5 text-center text-sm text-[#525C58]">
            New to ReNest Campus?{' '}
            <Link to="/register" className="font-semibold text-[#174C3C] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
