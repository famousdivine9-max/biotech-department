'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Trash2, Edit2, Download, Save, X, Loader2, Upload } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface Material {
  id: number;
  title: string;
  course_code: string;
  course_id: number;
  level_name: string;
  level_id: number;
  semester_name: string;
  semester_id: number;
  session_name: string;
  session_id: number;
  description: string;
  download_count: number;
  created_at: string;
  file_url: string;
}

interface AcademicData {
  sessions: { id: number; session_name: string }[];
  levels: { id: number; level_name: string }[];
  semesters: { id: number; semester_name: string }[];
  courses: { id: number; course_code: string; course_title: string }[];
}

export default function LecturerMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, acRes] = await Promise.all([
        api.materials.getMy(),
        api.public.getAcademic(),
      ]);
      setMaterials(matRes.data.materials);
      setAcademic(acRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setEditForm({
      title: m.title,
      description: m.description || '',
      course_id: m.course_id,
      level_id: m.level_id,
      semester_id: m.semester_id,
      session_id: m.session_id,
    });
    setReplaceFile(null);
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([k, v]) => formData.append(k, v as string));
      if (replaceFile) formData.append('file', replaceFile);
      await api.materials.update(id, formData);
      toast.success('Material updated');
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this material? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.materials.delete(id);
      toast.success('Material deleted');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">My Materials ({materials.length})</h2>

      {materials.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No materials yet. Upload from your dashboard.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((m) => (
            <div key={m.id} className="card">
              {editingId === m.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">Editing Material</h3>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Course</label>
                      <select className="input" value={editForm.course_id} onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}>
                        {academic?.courses.map((c) => <option key={c.id} value={c.id}>{c.course_code}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Session</label>
                      <select className="input" value={editForm.session_id} onChange={(e) => setEditForm({ ...editForm, session_id: e.target.value })}>
                        {academic?.sessions.map((s) => <option key={s.id} value={s.id}>{s.session_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Level</label>
                      <select className="input" value={editForm.level_id} onChange={(e) => setEditForm({ ...editForm, level_id: e.target.value })}>
                        {academic?.levels.map((l) => <option key={l.id} value={l.id}>{l.level_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Semester</label>
                      <select className="input" value={editForm.semester_id} onChange={(e) => setEditForm({ ...editForm, semester_id: e.target.value })}>
                        {academic?.semesters.map((s) => <option key={s.id} value={s.id}>{s.semester_name} Semester</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Replace File (optional)</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      {replaceFile ? (
                        <span className="text-primary-600 text-sm">{replaceFile.name}</span>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" /> Click to replace PDF
                        </span>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setReplaceFile(f); }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(m.id)} disabled={saving} className="btn-primary flex items-center gap-2">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{m.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {m.course_code} · {m.level_name} · {m.semester_name} Semester · {m.session_name}
                    </p>
                    {m.description && <p className="text-sm text-gray-400 mt-1">{m.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{m.download_count} downloads</span>
                      <span>Uploaded {new Date(m.created_at).toLocaleDateString('en-NG')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                    <button onClick={() => startEdit(m)}
                      className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
