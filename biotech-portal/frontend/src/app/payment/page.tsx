'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

export default function PaymentPage() {
  const [step, setStep] = useState(1);
  const [academic, setAcademic] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    full_name: '', matric_number: '', email: '', phone: '', level: '', academic_session: ''
  });
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(API + '/public/academic').then(r => r.json()),
      fetch(API + '/public/settings').then(r => r.json())
    ]).then(([acData, setData]) => {
      setAcademic(acData.data || acData);
      setSettings(setData.data || setData);
    }).catch(() => {});
  }, []);

  const dues = parseFloat(settings.departmental_dues || '1000');
  const fee = parseFloat(settings.processing_fee || '100');
  const total = dues + fee;

  const handleSubmit = async () => {
    if (!form.full_name || !form.matric_number || !form.email || !form.phone || !form.level || !form.academic_session) {
      setMsg('Please fill all fields'); return;
    }
    setStep(2);
  };

  const handlePay = async () => {
    setLoading(true); setMsg('');
    try {
      const res = await fetch(API + '/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || 'Payment failed'); setLoading(false); return; }
      setPaymentData(data.data);
      window.location.href = data.data.authorization_url;
    } catch (e) {
      setMsg('Network error. Please try again.');
    }
    setLoading(false);
  };

  const inputStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', boxSizing: 'border-box' as const, marginBottom: '12px' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600' as const, color: '#374151', marginBottom: '4px' };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #15803d, #0f766e)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Pay Departmental Dues</h1>
          <p style={{ color: '#bbf7d0', margin: '4px 0 0', fontSize: '14px' }}>Department of Biotechnology · FUL</p>
        </div>

        {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div>}

        {step === 1 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>Student Information</h2>

            <label style={labelStyle}>Full Name *</label>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Enter your full name" style={inputStyle} />

            <label style={labelStyle}>Matric Number *</label>
            <input value={form.matric_number} onChange={(e) => setForm({ ...form, matric_number: e.target.value })}
              placeholder="e.g. FUL/2021/001" style={inputStyle} />

            <label style={labelStyle}>Email Address *</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email" placeholder="your@email.com" style={inputStyle} />

            <label style={labelStyle}>Phone Number *</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08012345678" style={inputStyle} />

            <label style={labelStyle}>Level *</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} style={inputStyle}>
              <option value="">Select Level</option>
              {(academic?.levels || []).map((l: any) => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>

            <label style={labelStyle}>Academic Session *</label>
            <select value={form.academic_session} onChange={(e) => setForm({ ...form, academic_session: e.target.value })} style={inputStyle}>
              <option value="">Select Session</option>
              {(academic?.sessions || []).map((s: any) => (
                <option key={s.id} value={s.session_name}>{s.session_name}</option>
              ))}
            </select>

            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '12px', fontSize: '15px' }}>Payment Breakdown</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Departmental Dues</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>₦{dues.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Processing Fee</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>₦{fee.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid #d1fae5', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', color: '#1f2937' }}>Total Amount</span>
                <span style={{ fontWeight: '700', color: '#15803d', fontSize: '18px' }}>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleSubmit}
              style={{ width: '100%', background: '#15803d', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
              Continue to Review
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>Review & Pay</h2>

            {[
              ['Full Name', form.full_name],
              ['Matric Number', form.matric_number],
              ['Email', form.email],
              ['Phone', form.phone],
              ['Level', form.level],
              ['Session', form.academic_session],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{label}</span>
                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{value}</span>
              </div>
            ))}

            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', margin: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', color: '#1f2937' }}>Total to Pay</span>
                <span style={{ fontWeight: '700', color: '#15803d', fontSize: '20px' }}>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(1)}
                style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                Back
              </button>
              <button onClick={handlePay} disabled={loading}
                style={{ flex: 2, background: '#15803d', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Processing...' : `Pay ₦${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
