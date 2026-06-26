'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('biotech_token') : '';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/payments?search=${search}&limit=50&status=successful`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setPayments(data.payments || data.data?.payments || []);
      setTotal(data.total || 0);
      setRevenue(data.total_revenue || 0);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  const exportCSV = () => {
    const headers = ['Date', 'Student', 'Matric No', 'Level', 'Session', 'Amount', 'Receipt No', 'Status'];
    const rows = payments.map((p: any) => [
      new Date(p.created_at).toLocaleDateString('en-NG'),
      p.student_name || p.full_name,
      p.matric_number,
      p.level,
      p.session_name || p.academic_session,
      p.amount,
      p.receipt_number,
      p.payment_status || p.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(revenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500"
          placeholder="Search by name, matric, receipt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
        />
        <button onClick={fetchPayments} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={exportCSV} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Payments ({payments.length})</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No payments found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{p.student_name || p.full_name}</p>
                  <p className="text-sm text-gray-500">{p.matric_number} · {p.level} Level · {p.session_name || p.academic_session}</p>
                  <p className="text-xs text-gray-400">{p.receipt_number} · {new Date(p.created_at).toLocaleDateString('en-NG')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-800">{formatCurrency(p.amount)}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                    {p.payment_status || p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
