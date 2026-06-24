'use client';

import { useEffect, useState } from 'react';
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  student_name: string;
  matric_number: string;
  email: string;
  phone_number: string;
  level: string;
  session_name: string;
  amount: number;
  receipt_number: string;
  payment_reference: string;
  status: 'pending' | 'successful' | 'failed';
  created_at: string;
}

const statusColors = {
  pending: 'badge-warning',
  successful: 'badge-success',
  failed: 'badge-danger',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v);

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('successful');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPayments({ search, status: statusFilter, page, limit });
      setPayments(res.data.payments);
      setTotal(res.data.total);
      setTotalRevenue(res.data.total_revenue || 0);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [search, statusFilter, page]);

  const exportCSV = () => {
    const headers = ['Date', 'Student Name', 'Matric No', 'Email', 'Level', 'Session', 'Amount', 'Receipt No', 'Reference', 'Status'];
    const rows = payments.map((p) => [
      new Date(p.created_at).toLocaleDateString('en-NG'),
      p.student_name,
      p.matric_number,
      p.email,
      p.level,
      p.session_name,
      p.amount,
      p.receipt_number,
      p.payment_reference,
      p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Filtered Results</p>
          <p className="text-2xl font-bold text-gray-800">{total.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-700">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by name, matric, receipt..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input w-full sm:w-44"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={fetchPayments} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="btn-accent flex items-center gap-2 whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Payments ({total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Matric No</th>
                <th>Level</th>
                <th>Session</th>
                <th>Amount</th>
                <th>Receipt No</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No payments found</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td className="text-gray-500 text-sm whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('en-NG')}
                  </td>
                  <td>
                    <p className="font-medium text-gray-800">{p.student_name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="text-gray-600 font-mono text-sm">{p.matric_number}</td>
                  <td className="text-gray-600">{p.level} Level</td>
                  <td className="text-gray-600">{p.session_name}</td>
                  <td className="font-semibold text-gray-800">{formatCurrency(p.amount)}</td>
                  <td className="text-gray-600 font-mono text-sm">{p.receipt_number}</td>
                  <td>
                    <span className={`badge ${statusColors[p.status]}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {p.status === 'successful' && (
                      <a
                        href={`/api/payment/receipt/download/${p.receipt_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 inline-flex transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
