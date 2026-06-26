'use client';

import { useState } from 'react';
import { Search, Download } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('biotech_token') : '';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

export default function AdminReceiptsPage() {
  const [searchType, setSearchType] = useState('matric_number');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSearch = async () => {
    if (!searchValue.trim()) { setMsg('Enter a search value'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/payment/receipt/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ search_type: searchType, search_value: searchValue.trim() })
      });
      const data = await res.json();
      setResults(data.receipts || data.data?.receipts || []);
      setSearched(true);
    } catch (e) {
      setMsg('Search failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {msg && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Receipt Search</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500 w-full sm:w-52"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="matric_number">Matric Number</option>
            <option value="receipt_number">Receipt Number</option>
            <option value="payment_reference">Payment Reference</option>
          </select>
          <input
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500"
            placeholder="Enter search value..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searched && (
        results.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            No receipts found
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r: any) => (
              <div key={r.receipt_number} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-mono font-semibold text-green-700">{r.receipt_number}</p>
                    <p className="font-semibold text-gray-800 mt-1">{r.full_name || r.student_name}</p>
                    <p className="text-sm text-gray-500">{r.matric_number} · {r.level} Level · {r.academic_session || r.session_name}</p>
                    <p className="text-sm text-gray-400">{r.email}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="font-semibold text-gray-800">{formatCurrency(r.amount_paid || r.amount)}</span>
                      <span className="text-gray-400 text-sm">{new Date(r.issued_at || r.created_at).toLocaleDateString('en-NG')}</span>
                    </div>
                  </div>
                  
                    href={`${API}/payment/receipt/download/${r.receipt_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
