'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      setStatus('failed');
      setError('No payment reference found.');
      return;
    }

    fetch(API + '/payment/verify?reference=' + reference)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setReceipt(data);
          setStatus('success');
        } else {
          setStatus('failed');
          setError(data.message || 'Payment verification failed.');
        }
      })
      .catch(() => {
        setStatus('failed');
        setError('Network error. Please check your receipt using your matric number.');
      });
  }, [searchParams]);

  const fmt = (v: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ width: '56px', height: '56px', border: '4px solid #15803d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ color: '#1f2937', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Verifying Payment...</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && receipt && (
          <>
            {/* Success Icon */}
            <div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              ✅
            </div>
            <h2 style={{ color: '#15803d', fontSize: '22px', fontWeight: '800', margin: '0 0 4px' }}>Payment Successful!</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 24px' }}>Your departmental dues have been received.</p>

            {/* Receipt Card */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'monospace', fontWeight: '700', color: '#15803d', fontSize: '16px', textAlign: 'center', margin: '0 0 16px', letterSpacing: '1px' }}>
                {receipt.receipt_number}
              </p>
              {[
                ['Name', receipt.full_name],
                ['Matric No', receipt.matric_number],
                ['Level', receipt.level],
                ['Session', receipt.academic_session],
                ['Date', new Date(receipt.issued_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #d1fae5' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{label}</span>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#1f2937' }}>Amount Paid</span>
                <span style={{ fontWeight: '800', fontSize: '18px', color: '#15803d' }}>{fmt(parseFloat(receipt.amount_paid))}</span>
              </div>
            </div>

            {/* Download Button */}
            
              href={API + '/payment/receipt/download/' + receipt.receipt_number}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', background: '#15803d', color: 'white', textDecoration: 'none', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}
            >
              📄 Download Receipt
            </a>
            <Link href="/" style={{ display: 'block', background: '#f3f4f6', color: '#374151', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '14px' }}>
              Back to Home
            </Link>
            <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '16px' }}>
              You can always retrieve this receipt at <strong>Find Receipt</strong> using your matric number.
            </p>
          </>
        )} 

        {status === 'failed' && (
          <>
            <div style={{ fontSize: '48px', margin: '0 auto 16px' }}>❌</div>
            <h2 style={{ color: '#dc2626', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Verification Failed</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>{error}</p>
            <Link href="/receipt" style={{ display: 'block', background: '#15803d', color: 'white', textDecoration: 'none', padding: '13px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
              Find Receipt by Matric Number
            </Link>
            <Link href="/payment" style={{ display: 'block', background: '#f3f4f6', color: '#374151', textDecoration: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '14px' }}>
              Try Payment Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
