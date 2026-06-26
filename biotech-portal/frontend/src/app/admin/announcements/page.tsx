'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('biotech_token') || '' : '';
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch(API + '/admin/announcements', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      const data = await res.json();
      setAnnouncements(data.announcements || (data.data && data.data.announcements) || []);
    } catch (e) {}
    setLoading(false);
  }

  useEffect(() => { fetchAnnouncements(); }, []);

  async function handleCreate() {
    if (!title.trim() || !content.trim()) { setMsg('Fill in title and content'); return; }
    setSaving(true);
    try {
      await fetch(API + '/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
        body: JSON.stringify({ title, content, priority })
      });
      setMsg('Announcement created!');
      setTitle(''); setContent(''); setPriority('normal');
      setShowForm(false);
      fetchAnnouncements();
    } catch (e) {
      setMsg('Failed to create');
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await fetch(API + '/admin/announcements/' + id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + getToken() }
      });
      setMsg('Deleted');
      fetchAnnouncements();
    } catch (e) {
      setMsg('Delete failed');
    }
  }

  const priorityColors: any = {
    low: '#6b7280',
    normal: '#15803d',
    high: '#dc2626'
  };

  return (
    <div>
      {msg && <p style={{color:'#15803d', marginBottom:'16px', background:'#f0fdf4', padding:'12px', borderRadius:'8px'}}>{msg}</p>}

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
        <h2 style={{fontWeight:'600', fontSize:'18px', color:'#1f2937'}}>Announcements</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{background:'#15803d', color:'white', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer', fontSize:'14px'}}>
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {showForm && (
        <div style={{background:'white', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <h3 style={{fontWeight:'600', marginBottom:'16px'}}>Create Announcement</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{width:'100%', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 12px', fontSize:'14px', marginBottom:'12px', boxSizing:'border-box'}} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Content..."
            rows={4}
            style={{width:'100%', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 12px', fontSize:'14px', marginBottom:'12px', boxSizing:'border-box'}} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            style={{border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 12px', fontSize:'14px', marginBottom:'12px'}}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
          <div style={{display:'flex', gap:'12px'}}>
            <button onClick={handleCreate} disabled={saving}
              style={{background:'#15803d', color:'white', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer', fontSize:'14px'}}>
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{background:'#f3f4f6', color:'#374151', border:'none', borderRadius:'8px', padding:'8px 20px', cursor:'pointer', fontSize:'14px'}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center', padding:'48px', color:'#9ca3af'}}>Loading...</div>
      ) : announcements.length === 0 ? (
        <div style={{textAlign:'center', padding:'48px', color:'#9ca3af', background:'white', borderRadius:'16px'}}>No announcements yet</div>
      ) : (
        announcements.map((a: any) => (
          <div key={a.id} style={{background:'white', borderRadius:'16px', padding:'24px', marginBottom:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'16px'}}>
              <div style={{flex:1}}>
                <span style={{fontSize:'12px', fontWeight:'600', color:priorityColors[a.priority] || '#15803d', background:'#f0fdf4', padding:'2px 8px', borderRadius:'999px'}}>
                  {a.priority} priority
                </span>
                <h3 style={{fontWeight:'600', color:'#1f2937', margin:'8px 0 4px'}}>{a.title}</h3>
                <p style={{color:'#6b7280', fontSize:'14px'}}>{a.content}</p>
                <p style={{color:'#9ca3af', fontSize:'12px', marginTop:'8px'}}>{new Date(a.created_at).toLocaleString('en-NG')}</p>
              </div>
              <button onClick={() => handleDelete(a.id)}
                style={{background:'#fef2f2', color:'#dc2626', border:'none', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', fontSize:'14px', shrink:0}}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
