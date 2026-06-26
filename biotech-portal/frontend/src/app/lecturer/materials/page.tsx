'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('biotech_token') || '' : '';
}

export default function LecturerMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  async function fetchMaterials() {
    setLoading(true);
    try {
      const res = await fetch(API + '/materials/my', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      const data = await res.json();
      setMaterials(data.materials || (data.data && data.data.materials) || []);
    } catch (e) {
      setMsg('Failed to load materials');
    }
    setLoading(false);
  }

  useEffect(() => { fetchMaterials(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('Delete this material?')) return;
    setDeleting(id);
    try {
      await fetch(API + '/materials/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      setMsg('Material deleted');
      fetchMaterials();
    } catch (e) {
      setMsg('Delete failed');
    }
    setDeleting(null);
  }

  return (
    <div>
      {msg && <div style={{ background: '#f0fdf4', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>My Materials ({materials.length})</h2>
        <button onClick={fetchMaterials}
          style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading...</div>
      ) : materials.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          No materials yet. Upload from your dashboard.
        </div>
      ) : (
        materials.map((m: any) => (
          <div key={m.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{m.title}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0' }}>
                {m.course_code} · {m.level_name} · {m.semester_name} Semester · {m.session_name}
              </p>
              {m.description && <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0' }}>{m.description}</p>}
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                {m.download_count || 0} downloads · {new Date(m.created_at).toLocaleDateString('en-NG')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                style={{ background: '#eff6ff', color: '#2563eb', textDecoration: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: '500' }}>
                View
              </a>
              <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                {deleting === m.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
