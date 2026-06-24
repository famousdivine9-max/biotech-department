'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2, Edit2, Download, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface Material {
  id: number;
  title: string;
  course_code: string;
  level: string;
  semester: string;
  session_name: string;
  lecturer_name: string;
  download_count: number;
  created_at: string;
  file_url: string;
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.materials.getPublic({
        search, level: levelFilter, semester: semFilter, page, limit,
      });
      setMaterials(res.data.materials);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, [search, levelFilter, semFilter, page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.materials.adminDelete(id);
      toast.success('Material deleted');
      fetchMaterials();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input w-full sm:w-40"
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Levels</option>
            {['100', '200', '300', '400', '500'].map((l) => (
              <option key={l} value={l}>{l} Level</option>
            ))}
          </select>
          <select
            className="input w-full sm:w-40"
            value={semFilter}
            onChange={(e) => { setSemFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Semesters</option>
            <option value="First">First</option>
            <option value="Second">Second</option>
          </select>
          <button onClick={fetchMaterials} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Materials ({total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Level</th>
                <th>Semester</th>
                <th>Session</th>
                <th>Lecturer</th>
                <th>Downloads</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : materials.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No materials found</td></tr>
              ) : materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                      <span className="font-medium text-gray-800 line-clamp-1">{m.title}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">{m.course_code}</td>
                  <td className="text-gray-600">{m.level} Level</td>
                  <td className="text-gray-600">{m.semester}</td>
                  <td className="text-gray-600">{m.session_name}</td>
                  <td className="text-gray-600">{m.lecturer_name}</td>
                  <td className="text-gray-600">{m.download_count}</td>
                  <td className="text-gray-500 text-sm">
                    {new Date(m.created_at).toLocaleDateString('en-NG')}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View File"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
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
