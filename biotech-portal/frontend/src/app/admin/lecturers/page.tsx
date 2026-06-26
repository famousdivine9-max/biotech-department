'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, PauseCircle, Trash2, Key, RefreshCw, User } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('biotech_token') : '';

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/lecturers?search=${search}&limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setLecturers(data.lecturers || data.data?.lecturers || []);
    } catch (e) {
      setMsg('Failed to load lecturers');
    }
    setLoading(false);
  };

  useEffect(() => { fetchLecturers(); }, []);

  const handleAction = async (id: number, action: string) => {
    if (action === 'delete' && !confirm('Delete this lecturer?')) return;
    setActionLoading(id);
    try {
      if (action === 'delete') {
        await fetch(`${API}/admin/lecturers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
        setMsg('Lecturer deleted');
      } else if (action === 'reset') {
        const res = await fetch(`${API}/admin/lecturers/${id}/reset-password`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        alert(`Temporary password: ${data.temp_password || data.data?.temp_password}`);
      } else {
        await fetch(`${API}/admin/lecturers/${id}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action })
        });
        setMsg(`Lecturer ${action}d`);
      }
      fetchLecturers();
    } catch (e) {
      setMsg('Action failed');
    }
    setActionLoading(null);
  };

  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">{msg}</div>}
      
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500"
          placeholder="Search lecturers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLecturers()}
        />
        <button onClick={fetchLecturers} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Lecturers ({lecturers.length})</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lecturers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No lecturers found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lecturers.map((l: any) => (
              <div key={l.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{l.full_name}</p>
                  <p className="text-sm text-gray-500">{l.email} · {l.staff_id}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[l.status]}`}>
                    {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {l.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(l.id, 'approved')} disabled={actionLoading === l.id}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleAction(l.id, 'rejected')} disabled={actionLoading === l.id}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {l.status === 'approved' && (
                    <button onClick={() => handleAction(l.id, 'suspended')} disabled={actionLoading === l.id}
                      className="p-2 rounded-lg text-orange-600 hover:bg-orange-50" title="Suspend">
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  {(l.status === 'rejected' || l.status === 'suspended') && (
                    <button onClick={() => handleAction(l.id, 'approved')} disabled={actionLoading === l.id}
                      className="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Approve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleAction(l.id, 'reset')} disabled={actionLoading === l.id}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Reset Password">
                    <Key className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleAction(l.id, 'delete')} disabled={actionLoading === l.id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
