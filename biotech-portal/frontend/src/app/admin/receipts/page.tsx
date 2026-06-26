'use client';

import { useState } from 'react';
import { Search, Download, Receipt } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReceiptResult {
  receipt_number: string;
  student_name: string;
  matric_number: string;
  email: string;
  level: string;
  session_name: string;
  amount: number;
  payment_reference: string;
  created_at: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

export default function AdminReceiptsPage() {
  const [searchType, setSearchType] = useState('matric_number');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<ReceiptResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) { toast.error('Enter a search value'); return; }
    setLoading(true);
    try {
      const res = await api.payment.findReceipt(searchType, searchValue.trim());
      setResults(res.data.receipts || []);
      setSearched(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Receipt Search & Reissue</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="input w-full sm:w-52"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="matric_number">Matric Number</option>
            <option value="receipt_number">Receipt Number</option>
            <option value="payment_reference">Payment Reference</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Enter search value..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searched && (
        results.length === 0 ? (
          <div className="card text-center py-12">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No receipts found for that search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <div key={r.receipt_number} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-primary-700">{r.receipt_number}</span>
                      <span className="badge-success badge text-xs">Verified</span>
                    </div>
                    <p className="font-semibold text-gray-800">{r.student_name}</p>
                    <p className="text-sm text-gray-500">
                      {r.matric_number} · {r.level} Level · {r.session_name}
                    </p>
                    <p className="text-sm text-gray-400">{r.email}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="font-semibold text-gray-800">{formatCurrency(r.amount)}</span>
                      <span className="text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('en-NG')}
                      </span>
                    </div>
                  </div>
                  
                    href={api.payment.downloadReceiptUrl(r.receipt_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-2 shrink-0"
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
