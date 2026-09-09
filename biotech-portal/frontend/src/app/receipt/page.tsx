'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

export default function ReceiptPage() {
  const [searchType, setSearchType] = useState('matric_number');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSearch() {
    if (!searchValue.trim()) { setMsg('Enter a search value'); return; }
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(API + '/payment/receipt/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_type: searchType, search_value: searchValue.trim() })
      });
      const data = await res.json();
      setResults(data.receipts || (data.data && data.data.receipts) || []);
      setSearched(true);
    } catch (e) {
      setMsg('Search failed. Please try again.');
    }
    setLoading(false);
  }

  const fmt = (v: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #15803d, #0f766e)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Find Your Receipt</h1>
          <p style={{ color: '#bbf7d0', margin: '4px 0 0', fontSize: '14px' }}>Search by matric number, receipt number or payment reference</p>
        </div>

        {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div>}

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px' }}>
              <option value="matric_number">Matric Number</option>
              <option value="receipt_number">Receipt Number</option>
              <option value="payment_reference">Payment Reference</option>
            </select>
            <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter search value..."
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px' }} />
            <button onClick={handleSearch} disabled={loading}
              style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Searching...' : 'Find Receipt'}
            </button>
          </div>
        </div>

        {searched && results.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            No receipts found
          </div>
        )}

        {results.map((r: any) => (
          <div key={r.receipt_number} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ fontFamily: 'monospace', fontWeight: '700', color: '#15803d', fontSize: '16px', margin: '0 0 8px' }}>{r.receipt_number}</p>
                <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 4px' }}>{r.full_name}</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>{r.matric_number} · {r.level} · {r.academic_session}</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>{r.email}</p>
                <p style={{ fontWeight: '700', color: '#15803d', fontSize: '18px', margin: '8px 0 4px' }}>{fmt(r.amount_paid)}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{new Date(r.issued_at).toLocaleDateString('en-NG')}</p>
              </div>
              <a href={API + '/payment/receipt/download/' + r.receipt_number}
                target="_blank" rel="noopener noreferrer"
                style={{ background: '#15803d', color: 'white', textDecoration: 'none', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: '600', display: 'inline-block' }}>
                Download PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
