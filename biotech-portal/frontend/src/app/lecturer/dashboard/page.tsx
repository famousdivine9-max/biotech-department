'use client';

import { useEffect, useState, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('biotech_token') || '' : '';
}

export default function LecturerDashboardPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [academic, setAcademic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    course_code: '',
    level: '',
    semester: '',
    academic_session: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const userName = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('biotech_user') || '{}')?.name || 'Lecturer'
    : 'Lecturer';

  async function fetchData() {
    setLoading(true);
    try {
      const [matRes, acRes] = await Promise.all([
        fetch(API + '/materials/my', { headers: { Authorization: 'Bearer ' + getToken() } }),
        fetch(API + '/public/academic')
      ]);
      const matData = await matRes.json();
      const acData = await acRes.json();
      setMaterials(matData.materials || (matData.data && matData.data.materials) || []);
      setAcademic(acData.data || acData);
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleUpload() {
    if (!selectedFile) { setMsg('Please select a PDF file'); return; }
    if (!form.title || !form.course_code || !form.level || !form.semester || !form.academic_session) {
      setMsg('Fill all required fields'); return;
    }
    setUploading(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('course_code', form.course_code);
      formData.append('level', form.level);
      formData.append('semester', form.semester);
      formData.append('academic_session', form.academic_session);
      formData.append('description', form.description);
      formData.append('file', selectedFile);

      const res = await fetch(API + '/materials/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.message || 'Upload failed'); setUploading(false); return; }
      setMsg('Material uploaded successfully!');
      setForm({ title: '', course_code: '', level: '', semester: '', academic_session: '', description: '' });
      setSelectedFile(null);
      setShowUpload(false);
      fetchData();
    } catch (e) {
      setMsg('Upload failed. Please try again.');
    }
    setUploading(false);
  }

  const inputStyle = {
    width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px',
    padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' as const, marginBottom: '8px'
  };
  const btnStyle = {
    background: '#15803d', color: 'white', border: 'none', borderRadius: '8px',
    padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' as const
  };

  return (
    <div>
      {msg && (
        <div style={{ background: msg.includes('success') ? '#f0fdf4' : '#fef2f2', color: msg.includes('success') ? '#15803d' : '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {msg}
        </div>
      )}

      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg, #15803d, #0f766e)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Welcome, {userName.split(' ')[0]}!</h1>
        <p style={{ color: '#bbf7d0', marginTop: '4px', fontSize: '14px', margin: '4px 0 0' }}>Manage your course materials below.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#15803d', margin: 0 }}>{materials.length}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>Materials Uploaded</p>
        </div>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#0f766e', margin: 0 }}>{materials.reduce((s, m) => s + (m.download_count || 0), 0)}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>Total Downloads</p>
        </div>
      </div>

      {/* Upload Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>My Materials</h2>
        <button onClick={() => setShowUpload(!showUpload)} style={btnStyle}>
          {showUpload ? 'Cancel' : '+ Upload Material'}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Upload New Material</h3>

          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Material Title *" style={inputStyle} />

          <select value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} style={inputStyle}>
            <option value="">Select Course *</option>
            {(academic?.courses || []).map((c: any) => (
              <option key={c.id} value={c.course_code}>{c.course_code} - {c.course_title}</option>
            ))}
          </select>

          <select value={form.academic_session} onChange={(e) => setForm({ ...form, academic_session: e.target.value })} style={inputStyle}>
            <option value="">Select Session *</option>
            {(academic?.sessions || []).map((s: any) => (
              <option key={s.id} value={s.session_name}>{s.session_name}</option>
            ))}
          </select>

          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} style={inputStyle}>
            <option value="">Select Level *</option>
            {(academic?.levels || []).map((l: any) => (
              <option key={l.id} value={l.name || l.level_name}>{l.name || l.level_name}</option>
            ))}
          </select>

          <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} style={inputStyle}>
            <option value="">Select Semester *</option>
            {(academic?.semesters || []).map((s: any) => (
              <option key={s.id} value={s.name || s.semester_name}>{s.name || s.semester_name} Semester</option>
            ))}
          </select>

          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={3} style={inputStyle} />

          <div onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px' }}>
            {selectedFile ? (
              <p style={{ color: '#15803d', fontSize: '14px', margin: 0 }}>
                📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Click to select PDF file (max 50MB)</p>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 50 * 1024 * 1024) { setMsg('File too large (max 50MB)'); return; }
                if (f.type !== 'application/pdf') { setMsg('Only PDF files allowed'); return; }
                setSelectedFile(f);
              }
            }} />

          <button onClick={handleUpload} disabled={uploading} style={btnStyle}>
            {uploading ? 'Uploading... Please wait' : 'Upload Material'}
          </button>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading...</div>
      ) : materials.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          No materials uploaded yet
        </div>
      ) : (
        materials.map((m: any) => (
          <div key={m.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '24px', flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{m.title}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0' }}>{m.course_code} · {m.level_name} · {m.semester_name}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{m.download_count || 0} downloads</p>
            </div>
            <a href={m.file_url} target="_blank" rel="noopener noreferrer"
              style={{ color: '#15803d', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
              View
            </a>
          </div>
        ))
      )}
    </div>
  );
}
