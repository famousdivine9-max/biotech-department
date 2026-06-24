'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Shield, ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

declare global {
  interface Window { PaystackPop: any; }
}

interface PaymentForm {
  full_name: string;
  matric_number: string;
  email: string;
  phone: string;
  level: string;
  academic_session: string;
}

export default function PaymentPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [academicData, setAcademicData] = useState<{ sessions: any[]; levels: any[] }>({ sessions: [], levels: [] });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [formValues, setFormValues] = useState<PaymentForm | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<PaymentForm>();

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, academicRes] = await Promise.all([api.getPublicSettings(), api.getAcademicData()]);
        setSettings(settingsRes.data.data);
        setAcademicData(academicRes.data.data);

        // Load Paystack script
        if (!document.getElementById('paystack-script')) {
          const script = document.createElement('script');
          script.id = 'paystack-script';
          script.src = 'https://js.paystack.co/v1/inline.js';
          document.head.appendChild(script);
        }
      } catch (e) {}
    };
    load();
  }, []);

  const dues = parseFloat(settings.departmental_dues || '2000');
  const processingFee = parseFloat(settings.processing_fee || '100');
  const total = dues + processingFee;

  const onSubmit = (values: PaymentForm) => {
    setFormValues(values);
    setStep('review');
  };

  const initiatePayment = async () => {
    if (!formValues) return;
    setLoading(true);
    try {
      const res = await api.initiatePayment(formValues);
      const { authorization_url, reference, access_code } = res.data.data;

      setPaymentData(res.data.data);

      // Use Paystack inline if available
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: settings.paystack_public_key || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: formValues.email,
          amount: Math.round(total * 100),
          ref: reference,
          access_code,
          metadata: { full_name: formValues.full_name, matric_number: formValues.matric_number },
          onClose: () => toast('Payment window closed.'),
          callback: async (response: any) => {
            try {
              const verifyRes = await api.verifyPayment(response.reference);
              if (verifyRes.data.success) {
                setPaymentData(verifyRes.data.data);
                setStep('success');
                toast.success('Payment successful! Receipt generated.');
              }
            } catch (e) {
              toast.error('Payment verification failed. Please contact support.');
            }
          },
        });
        handler.openIframe();
      } else {
        // Fallback: redirect
        window.location.href = authorization_url;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary-700 text-white py-4 px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 text-green-200 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} /> Back to Home
          </Link>
          <div className="h-5 border-l border-white/30" />
          <h1 className="font-heading font-bold text-lg">Departmental Dues Payment</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { id: 'form', label: 'Your Details' },
            { id: 'review', label: 'Review' },
            { id: 'success', label: 'Payment Done' },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.id ? 'bg-primary-700 text-white' :
                (step === 'review' && i === 0) || step === 'success' ? 'bg-green-100 text-primary-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {(step === 'review' && i === 0) || step === 'success' ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s.id ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 w-12" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Form */}
        {step === 'form' && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CreditCard className="text-primary-700" size={20} />
              </div>
              <div>
                <h2 className="font-heading font-bold text-gray-900">Student Information</h2>
                <p className="text-sm text-gray-500">Enter your details to proceed with payment</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    {...register('full_name', { required: 'Full name is required' })}
                    className="input"
                    placeholder="e.g. Amina Ibrahim"
                  />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="label">Matric Number *</label>
                  <input
                    {...register('matric_number', { required: 'Matric number is required' })}
                    className="input uppercase"
                    placeholder="e.g. FUL/BTH/21/001"
                  />
                  {errors.matric_number && <p className="text-red-500 text-xs mt-1">{errors.matric_number.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                    })}
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    {...register('phone', { required: 'Phone number is required' })}
                    type="tel"
                    className="input"
                    placeholder="08012345678"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Level *</label>
                  <select {...register('level', { required: 'Level is required' })} className="input">
                    <option value="">Select Level</option>
                    {academicData.levels.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                  {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level.message}</p>}
                </div>
                <div>
                  <label className="label">Academic Session *</label>
                  <select {...register('academic_session', { required: 'Session is required' })} className="input">
                    <option value="">Select Session</option>
                    {academicData.sessions.map((s) => (
                      <option key={s.id} value={s.session_name}>{s.session_name}</option>
                    ))}
                  </select>
                  {errors.academic_session && <p className="text-red-500 text-xs mt-1">{errors.academic_session.message}</p>}
                </div>
              </div>

              {/* Fee summary */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Payment Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departmental Dues</span>
                    <span className="font-medium">₦{dues.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt Processing Fee</span>
                    <span className="font-medium">₦{processingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-primary-700">₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 text-base">
                Continue to Review
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 'review' && formValues && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Shield className="text-amber-600" size={20} />
              </div>
              <div>
                <h2 className="font-heading font-bold text-gray-900">Review Your Details</h2>
                <p className="text-sm text-gray-500">Confirm your information before payment</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                ['Full Name', formValues.full_name],
                ['Matric Number', formValues.matric_number],
                ['Email Address', formValues.email],
                ['Phone Number', formValues.phone],
                ['Level', formValues.level],
                ['Academic Session', formValues.academic_session],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary-700 rounded-xl p-5 mb-6 text-white">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total to Pay</span>
                <span className="text-2xl font-bold font-heading">₦{total.toLocaleString()}</span>
              </div>
              <p className="text-green-200 text-xs mt-1">Secured by Paystack payment gateway</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="btn-secondary flex-1">
                Edit Details
              </button>
              <button
                onClick={initiatePayment}
                disabled={loading}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {loading ? 'Processing...' : 'Pay ₦' + total.toLocaleString()}
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Shield size={11} /> SSL secured. We never store your card details.
            </p>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 'success' && paymentData?.receipt && (
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-primary-700" size={32} />
            </div>
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-6 text-sm">Your departmental dues have been received. Your receipt has been generated.</p>

            <div className="bg-gray-50 rounded-xl p-5 text-left mb-6 space-y-3">
              {[
                ['Receipt Number', paymentData.receipt.receipt_number],
                ['Student Name', paymentData.receipt.full_name],
                ['Matric Number', paymentData.receipt.matric_number],
                ['Amount Paid', `₦${parseFloat(paymentData.receipt.amount_paid).toLocaleString()}`],
                ['Academic Session', paymentData.receipt.academic_session],
                ['Payment Reference', paymentData.receipt.payment_reference],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <a
                href={api.downloadReceiptUrl(paymentData.receipt.receipt_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1"
              >
                Download Receipt PDF
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-4">A copy has been sent to your email address.</p>
          </div>
        )}
      </main>
    </div>
  );
}
