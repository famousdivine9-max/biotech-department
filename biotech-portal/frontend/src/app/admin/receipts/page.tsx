'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('biotech_token') || '' : '';
}

export default function AdminReceiptsPage() {
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
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ search_type: searchType, search_value: searchValue.trim() })
      });
      const data = await res.json();
      setResults(data.receipts || (data.data && data.data.receipts) || []);
      setSearched(true);
    } catch (e) {
      setMsg('Search failed');
    }
    setLoading(false);
  }

  const fmt = (v: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

  return (
    <div>
      {msg && <p style={{color:'red', marginBottom:'16px'}}>{msg}</p>}

      <div style={{background:'white', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <h2 style={{fontWeight:'600', marginBottom:'16px'}}>Receipt Search</h2>
        <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}
            style={{border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 12px', fontSize:'14px'}}>
            <option value="matric_number">Matric Number</option>
            <option value="receipt_number">Receipt Number</option>
            <option value="payment_reference">Payment Reference</option>
          </select>
          <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter search value..."
            style={{flex:'1', minWidth:'200px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 12px', fontSize:'14px'}} />
          <button onClick={handleSearch} disabled={loading}
            style={{background:'#15803d', color:'white', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer', fontSize:'14px'}}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searched && results.length === 0 && (
        <div style={{background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', color:'#9ca3af'}}>
          No receipts found
        </div>
      )}

      {results.map((r: any) => (
        <div key={r.receipt_number} style={{background:'white', borderRadius:'16px', padding:'24px', marginBottom:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px'}}>
          <div>
            <p style={{fontFamily:'monospace', color:'#15803d', fontWeight:'600'}}>{r.receipt_number}</p>
            <p style={{fontWeight:'600', color:'#1f2937'}}>{r.full_name || r.student_name}</p>
            <p style={{fontSize:'14px', color:'#6b7280'}}>{r.matric_number} · {r.level} Level</p>
            <p style={{fontWeight:'600'}}>{fmt(r.amount_paid || r.amount)}</p>
          </div>
          <a href={API + '/payment/receipt/download/' + r.receipt_number}
            target="_blank" rel="noopener noreferrer"
            style={{background:'#15803d', color:'white', textDecoration:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'14px'}}>
            Download PDF
          </a>
        </div>
      ))}
    </div>
  );
}
