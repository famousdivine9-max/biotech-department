'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [academic, setAcademic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(API + '/public/academic')
      .then(r => r.json())
      .then(data => setAcademic(data.data || data))
      .catch(() => {});
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    try {
      let url = API + '/materials/public?limit=50';
      if (search) url += `&search=${search}`;
      if (levelFilter) url += `&level=${levelFilter}`;
      if (semFilter) url += `&semester=${semFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setMaterials(data.materials || data.data || []);
    } catch (e) {
      setMsg('Failed to load materials');
    }
    setLoading(false);
  }

  async function handleDownload(id: number, fileUrl: string, title: string) {
    try {
      await fetch(API + '/materials/download/' + id, { method: 'POST' });
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = title + '.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {}
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #15803d, #0f766e)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Course Materials</h1>
          <p style={{ color: '#bbf7d0', margin: '4px 0 0', fontSize: '14px' }}>Browse and download course materials</p>
        </div>

        {msg && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div>}

        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMaterials()}
            placeholder="Search materials..."
            style={{ flex: 1, minWidth: '200px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }} />
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            <option value="">All Levels</option>
            {(academic?.levels || []).map((l: any) => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </select>
          <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
            style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            <option value="">All Semesters</option>
            {(academic?.semesters || []).map((s: any) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <button onClick={fetchMaterials}
            style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px' }}>
            Search
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading materials...</div>
        ) : materials.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            No materials found
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {materials.map((m: any) => (
              <div key={m.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 4px' }}>{m.title}</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>
                    {m.course_code} · {m.level_name} · {m.semester_name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                    By {m.lecturer_name} · {m.download_count || 0} downloads
                  </p>
                </div>
                <button onClick={() => handleDownload(m.id, m.file_url, m.title)}
                  style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
