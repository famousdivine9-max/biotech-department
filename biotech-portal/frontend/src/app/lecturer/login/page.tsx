'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type LoginData = z.infer<typeof loginSchema>;
type ForgotData = z.infer<typeof forgotSchema>;

export default function LecturerLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });

  const onLogin = async (data: LoginData) => {
    try {
      const res = await api.auth.lecturerLogin(data.email, data.password);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      router.push('/lecturer/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onForgot = async (data: ForgotData) => {
    try {
      await api.auth.forgotPassword(data.email);
      setForgotSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-8 h-8 text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-white">Lecturer Portal</h1>
          <p className="text-primary-200 mt-1">Department of Biotechnology · FUL</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!forgotMode ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                <div>
                  <label className="label">Email Address</label>
                  <input {...loginForm.register('email')} type="email" className="input" placeholder="your@email.com" />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Your password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setForgotMode(true)}
                    className="text-sm text-primary-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <button type="submit" disabled={loginForm.formState.isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loginForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">
                No account?{' '}
                <Link href="/lecturer/register" className="text-primary-600 font-medium hover:underline">Register here</Link>
              </p>
            </>
          ) : forgotSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Check Your Email</h3>
              <p className="text-gray-500 text-sm mb-4">
                A password reset link has been sent to your email address.
              </p>
              <button onClick={() => { setForgotMode(false); setForgotSent(false); }}
                className="text-primary-600 font-medium hover:underline text-sm">
                Back to login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Forgot Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email to receive a reset link.</p>
              <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input {...forgotForm.register('email')} type="email" className="input" placeholder="your@email.com" />
                  {forgotForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>
                <button type="submit" disabled={forgotForm.formState.isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {forgotForm.formState.isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
              <button onClick={() => setForgotMode(false)} className="w-full text-center text-sm text-gray-500 mt-3 hover:text-gray-700">
                ← Back to login
              </button>
            </>
          )}
        </div>

        <p className="text-center mt-4 text-primary-200 text-sm">
          <Link href="/" className="hover:text-white">← Back to Portal</Link>
        </p>
      </div>
    </div>
  );
}
