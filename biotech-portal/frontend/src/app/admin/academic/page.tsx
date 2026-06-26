'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('biotech_token') || '' : '';
}

export default function AdminAcademicPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newSession, setNewSession] = useState('');
  const [courseForm, setCourseForm] = useState({ course_code: '', course_title: '', level_id: '', semester_id: '' });
  const [msg, setMsg] = useState('');

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(API + '/admin/academic', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      const d = await res.json();
      setData(d.data || d);
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAddSession() {
    if (!newSession.trim()) return;
    try {
      await fetch(API + '/admin/academic/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ session_name: newSession })
      });
      setMsg('Session created!');
      setNewSession('');
      fetchData();
    } catch (e) {
      setMsg('Failed to create session');
    }
  }

  async function handleAddCourse() {
    if (!courseForm.course_code || !courseForm.course_title || !courseForm.level_id || !courseForm.semester_id) {
      setMsg('Fill all course fields');
      return;
    }
    try {
      await fetch(API + '/admin/academic/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify(courseForm)
      });
      setMsg('Course created!');
      setCourseForm({ course_code: '', course_title: '', level_id: '', semester_id: '' });
      fetchData();
    } catch (e) {
      setMsg('Failed to create course');
    }
  }

  const inputStyle = { width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' as const, marginBottom: '8px' };
  const btnStyle = { background: '#15803d', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px' };
  const cardStyle = { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' };

  if (loading) return <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading...</div>;

  return (
    <div>
      {msg && <p style={{ color: '#15803d', background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{msg}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

        {/* Sessions */}
        <div style={cardStyle}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Academic Sessions</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input value={newSession} onChange={(e) => setNewSession(e.target.value)}
              placeholder="e.g. 2024/2025"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
              style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }} />
            <button onClick={handleAddSession} style={btnStyle}>Add</button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {(data?.sessions || []).map((s: any) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f9fafb', borderRadius: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{s.session_name}</span>
                {s.is_current && <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Active</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Levels */}
        <div style={cardStyle}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Levels</h3>
          {(data?.levels || []).map((l: any) => (
            <div key={l.id} style={{ padding: '8px', background: '#f9fafb', borderRadius: '8px', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              {l.name || l.level_name}
            </div>
          ))}
        </div>

        {/* Add Course */}
        <div style={cardStyle}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Add Course</h3>
          <input value={courseForm.course_code} onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
            placeholder="Course Code (e.g. BIO 201)" style={inputStyle} />
          <input value={courseForm.course_title} onChange={(e) => setCourseForm({ ...courseForm, course_title: e.target.value })}
            placeholder="Course Title" style={inputStyle} />
          <select value={courseForm.level_id} onChange={(e) => setCourseForm({ ...courseForm, level_id: e.target.value })}
            style={inputStyle}>
            <option value="">Select Level</option>
            {(data?.levels || []).map((l: any) => (
              <option key={l.id} value={l.id}>{l.name || l.level_name}</option>
            ))}
          </select>
          <select value={courseForm.semester_id} onChange={(e) => setCourseForm({ ...courseForm, semester_id: e.target.value })}
            style={inputStyle}>
            <option value="">Select Semester</option>
            {(data?.semesters || []).map((s: any) => (
              <option key={s.id} value={s.id}>{s.name || s.semester_name} Semester</option>
            ))}
          </select>
          <button onClick={handleAddCourse} style={btnStyle}>Add Course</button>
        </div>

      </div>

      {/* Courses Table */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>All Courses ({(data?.courses || []).length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Code</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Title</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Level</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Semester</th>
              </tr>
            </thead>
            <tbody>
              {(data?.courses || []).map((c: any) => (
                <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', color: '#15803d', fontFamily: 'monospace', fontWeight: '600' }}>{c.course_code}</td>
                  <td style={{ padding: '12px', color: '#374151' }}>{c.course_title}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{c.level_name}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{c.semester_name} Semester</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
