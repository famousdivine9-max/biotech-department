'use client';

import { useEffect, useState } from 'react';
import { FileText, Trash2, Download, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('biotech_token') : '';

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/materials/public?search=${search}&limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setMaterials(data.materials || data.data?.materials || []);
    } catch (e) {
      setMsg('Failed to load materials');
    }
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material?')) return;
    try {
      await fetch(`${API}/materials/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setMsg('Material deleted');
      fetchMaterials();
    } catch (e) {
      setMsg('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-500"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchMaterials()}
        />
        <button onClick={fetchMaterials} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Materials ({materials.length})</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No materials found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {materials.map((m: any) => (
              <div key={m.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 line-clamp-1">{m.title}</p>
                  <p className="text-sm text-gray-500">{m.course_code} · {m.level_name} · {m.semester_name} · {m.session_name}</p>
                  <p className="text-xs text-gray-400">{m.lecturer_name} · {m.download_count} downloads</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50">
                    <Download className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50">
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
