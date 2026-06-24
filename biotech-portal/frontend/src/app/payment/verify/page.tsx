'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import Link from 'next/link';

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      setStatus('failed');
      setError('No payment reference found');
      return;
    }

    api.payment.verify(reference)
      .then((res) => {
        setReceipt(res.data);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('failed');
        setError(getErrorMessage(err));
      });
  }, [searchParams]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment...</h2>
            <p className="text-gray-500">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && receipt && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Payment Successful!</h2>
            <p className="text-gray-500 mb-6">Your dues payment has been confirmed.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Receipt Number</span>
                <span className="font-semibold text-gray-800 text-sm">{receipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Amount Paid</span>
                <span className="font-semibold text-gray-800 text-sm">{formatCurrency(receipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Session</span>
                <span className="font-semibold text-gray-800 text-sm">{receipt.session_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Date</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {new Date(receipt.created_at).toLocaleDateString('en-NG')}
                </span>
              </div>
            </div>

            <a
              href={api.payment.downloadReceiptUrl(receipt.receipt_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full block mb-3"
            >
              Download Receipt PDF
            </a>
            <Link href="/" className="btn-secondary w-full block">
              Back to Portal
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-6">{error || 'Unable to verify your payment. Please contact support.'}</p>
            <Link href="/payment" className="btn-primary w-full block mb-3">Try Again</Link>
            <Link href="/" className="btn-secondary w-full block">Back to Portal</Link>
          </>
        )}
      </div>
    </div>
  );
}
