'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

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
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState('');

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const forgotForm = useForm<ForgotData>({ resolver: zodResolver(forgotSchema) });

  const onLogin = async (data: LoginData) => {
    setError('');
    try {
      const res = await fetch(API + '/auth/lecturer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message || 'Login failed'); return; }
      const token = result.token || (result.data && result.data.token);
      const user = result.user || (result.data && result.data.user);
      if (!token) { setError('Login failed - no token received'); return; }
      localStorage.setItem('biotech_token', token);
      localStorage.setItem('biotech_user', JSON.stringify(user));
      window.location.href = '/lecturer/dashboard';
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const onForgot = async (data: ForgotData) => {
    try {
      await fetch(API + '/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });
      setForgotSent(true);
    } catch (err) {
      setError('Failed to send reset email');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #14532d, #0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'white', borderRadius: '16px', marginBottom: '16px' }}>
            <GraduationCap style={{ width: '32px', height: '32px', color: '#15803d' }} />
          </div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>Lecturer Portal</h1>
          <p style={{ color: '#bbf7d0', marginTop: '4px', fontSize: '14px' }}>Department of Biotechnology · FUL</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
          {!forgotMode ? (
            <>
              <h2 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '24px', fontSize: '20px' }}>Sign In</h2>
              {error && <p style={{ color: '#dc2626', background: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
              <form onSubmit={loginForm.handleSubmit(onLogin)}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email Address</label>
                  <input {...loginForm.register('email')} type="email"
                    style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="your@email.com" />
                  {loginForm.formState.errors.email && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{loginForm.formState.errors.email.message}</p>}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input {...loginForm.register('password')} type={showPassword ? 'text' : 'password'}
                      style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 40px 10px 14px', fontSize: '14px', boxSizing: 'border-box' }}
                      placeholder="Your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                      {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{loginForm.formState.errors.password.message}</p>}
                </div>
                <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setForgotMode(true)}
                    style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '13px', cursor: 'pointer' }}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" disabled={loginForm.formState.isSubmitting}
                  style={{ width: '100%', background: '#15803d', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loginForm.formState.isSubmitting ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In'}
                </button>
              </form>
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '16px' }}>
                No account? <Link href="/lecturer/register" style={{ color: '#15803d', fontWeight: '600' }}>Register here</Link>
              </p>
            </>
          ) : forgotSent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Check Your Email</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>A password reset link has been sent.</p>
              <button onClick={() => { setForgotMode(false); setForgotSent(false); }}
                style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontSize: '14px' }}>
                Back to login
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '8px', fontSize: '20px' }}>Forgot Password</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Enter your email to receive a reset link.</p>
              <form onSubmit={forgotForm.handleSubmit(onForgot)}>
                <div style={{ marginBottom: '16px' }}>
                  <input {...forgotForm.register('email')} type="email"
                    style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="your@email.com" />
                </div>
                <button type="submit" disabled={forgotForm.formState.isSubmitting}
                  style={{ width: '100%', background: '#15803d', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                  {forgotForm.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <button onClick={() => setForgotMode(false)}
                style={{ width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#6b7280', marginTop: '12px', cursor: 'pointer', fontSize: '14px' }}>
                ← Back to login
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#bbf7d0', textDecoration: 'none' }}>← Back to Portal</Link>
        </p>
      </div>
    </div>
  );
}
