'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('biotech_token') || '' : '';
}

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  async function fetchLecturers() {
    setLoading(true);
    try {
      const res = await fetch(API + '/admin/lecturers?search=' + search + '&limit=50', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      const data = await res.json();
      const list = data.lecturers || (data.data && data.data.lecturers) || data.data || [];
      setLecturers(Array.isArray(list) ? list : []);
    } catch (e) {
      setMsg('Failed to load lecturers');
    }
    setLoading(false);
  }

  useEffect(() => { fetchLecturers(); }, []);

  async function handleAction(id: number, action: string) {
    if (action === 'delete' && !confirm('Delete this lecturer?')) return;
    setActionLoading(id);
    try {
      if (action === 'delete') {
        await fetch(API + '/admin/lecturers/' + id, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + getToken() }
        });
        setMsg('Lecturer deleted');
      } else if (action === 'reset') {
        const res = await fetch(API + '/admin/lecturers/' + id + '/reset-password', {
          method: 'PATCH',
          headers: { Authorization: 'Bearer ' + getToken() }
        });
        const data = await res.json();
        alert('Temporary password: ' + (data.temp_password || (data.data && data.data.temp_password) || 'Check email'));
      } else {
        await fetch(API + '/admin/lecturers/' + id + '/status', {
          method: 'PATCH',
          headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action })
        });
        setMsg('Lecturer ' + action);
      }
      fetchLecturers();
    } catch (e) {
      setMsg('Action failed');
    }
    setActionLoading(null);
  }

  const statusColors: any = {
    pending: { background: '#fef9c3', color: '#92400e' },
    approved: { background: '#dcfce7', color: '#15803d' },
    rejected: { background: '#fee2e2', color: '#dc2626' },
    suspended: { background: '#f3f4f6', color: '#6b7280' },
  };

  const btnStyle = (color: string) => ({
    background: color, color: 'white', border: 'none', borderRadius: '6px',
    padding: '6px 12px', cursor: 'pointer', fontSize: '12px', marginRight: '4px'
  });

  return (
    <div>
      {msg && (
        <div style={{ background: '#f0fdf4', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '12px' }}>
        <input
          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}
          placeholder="Search lecturers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLecturers()}
        />
        <button onClick={fetchLecturers}
          style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}>
          Refresh
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontWeight: '600', color: '#1f2937' }}>Lecturers ({lecturers.length})</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading...</div>
        ) : lecturers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>No lecturers found</div>
        ) : (
          lecturers.map((l: any) => (
            <div key={l.id} style={{ padding: '16px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#15803d', fontWeight: '600' }}>{l.full_name?.charAt(0)}</span>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{l.full_name}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0' }}>{l.email} · {l.staff_id}</p>
                <span style={{ ...statusColors[l.status], fontSize: '12px', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
                  {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {l.status === 'pending' && (
                  <>
                    <button onClick={() => handleAction(l.id, 'approved')} disabled={actionLoading === l.id} style={btnStyle('#15803d')}>Approve</button>
                    <button onClick={() => handleAction(l.id, 'rejected')} disabled={actionLoading === l.id} style={btnStyle('#dc2626')}>Reject</button>
                  </>
                )}
                {l.status === 'approved' && (
                  <button onClick={() => handleAction(l.id, 'suspended')} disabled={actionLoading === l.id} style={btnStyle('#d97706')}>Suspend</button>
                )}
                {(l.status === 'rejected' || l.status === 'suspended') && (
                  <button onClick={() => handleAction(l.id, 'approved')} disabled={actionLoading === l.id} style={btnStyle('#15803d')}>Approve</button>
                )}
                <button onClick={() => handleAction(l.id, 'reset')} disabled={actionLoading === l.id} style={btnStyle('#2563eb')}>Reset Password</button>
                <button onClick={() => handleAction(l.id, 'delete')} disabled={actionLoading === l.id} style={btnStyle('#dc2626')}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
