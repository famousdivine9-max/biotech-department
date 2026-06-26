'use client';

import { useState } from 'react';

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
    setMsg('');
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
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-full sm:w-52"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="matric_number">Matric Number</option>
            <option
