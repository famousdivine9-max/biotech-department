'use client';

import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Download, Eye, Loader2, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

interface Stats {
  total_materials: number;
  total_downloads: number;
}

interface AcademicData {
  sessions: { id: number; session_name: string }[];
  levels: { id: number; level_name: string; level_number: number }[];
  semesters: { id: number; semester_name: string }[];
  courses: { id: number; course_code: string; course_title: string }[];
}

interface Material {
  id: number;
  title: string;
  course_code: string;
  level_name: string;
  semester_name: string;
  session_name: string;
  download_count: number;
  created_at: string;
  file_url: string;
}

export default function LecturerDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ total_materials: 0, total_downloads: 0 });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{
    title: string; course_id: string; level_id: string;
    semester_id: string; session_id: string; description: string;
  }>();

  const fetchData = async () => {
    try {
      const [matRes, acRes] = await Promise.all([
        api.materials.getMy(),
        api.public.getAcademic(),
      ]);
      const mats: Material[] = matRes.data.materials;
      setMaterials(mats);
      setStats({
        total_materials: mats.length,
        total_downloads: mats.reduce((s, m) => s + m.download_count, 0),
      });
      setAcademic(acRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data: any) => {
    if (!selectedFile) { toast.error('Please select a PDF file'); return; }
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v as string));
    formData.append('file', selectedFile);
    try {
      await api.materials.upload(formData);
      toast.success('Material uploaded successfully');
      reset();
      setSelectedFile(null);
      setShowUpload(false);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">Welcome, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-primary-100 text-sm">Manage your course materials below.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-700 mb-1">{stats.total_materials}</div>
          <div className="text-sm text-gray-500">Materials Uploaded</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-secondary-700 mb-1">{stats.total_downloads}</div>
          <div className="text-sm text-gray-500">Total Downloads</div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">My Materials</h2>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary flex items-center gap-2">
          {showUpload ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUpload ? 'Cancel' : 'Upload Material'}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Upload New Material</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Material Title</label>
              <input {...register('title', { required: 'Title is required' })} className="input" placeholder="e.g. Introduction to Molecular Biology - Week 1" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Course</label>
                <select {...register('course_id', { required: 'Select a course' })} className="input">
                  <option value="">Select course</option>
                  {academic?.courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.course_code} - {c.course_title}</option>
                  ))}
                </select>
                {errors.course_id && <p className="text-red-500 text-xs mt-1">{errors.course_id.message}</p>}
              </div>
              <div>
                <label className="label">Academic Session</label>
                <select {...register('session_id', { required: 'Select a session' })} className="input">
                  <option value="">Select session</option>
                  {academic?.sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.session_name}</option>
                  ))}
                </select>
                {errors.session_id && <p className="text-red-500 text-xs mt-1">{errors.session_id.message}</p>}
              </div>
              <div>
                <label className="label">Level</label>
                <select {...register('level_id', { required: 'Select a level' })} className="input">
                  <option value="">Select level</option>
                  {academic?.levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.level_name}</option>
                  ))}
                </select>
                {errors.level_id && <p className="text-red-500 text-xs mt-1">{errors.level_id.message}</p>}
              </div>
              <div>
                <label className="label">Semester</label>
                <select {...register('semester_id', { required: 'Select a semester' })} className="input">
                  <option value="">Select semester</option>
                  {academic?.semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.semester_name} Semester</option>
                  ))}
                </select>
                {errors.semester_id && <p className="text-red-500 text-xs mt-1">{errors.semester_id.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Description (optional)</label>
              <textarea {...register('description')} className="input min-h-[80px]" placeholder="Brief description of this material..." />
            </div>

            {/* File Upload */}
            <div>
              <label className="label">PDF File (max 50MB)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary-600">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-gray-400 text-sm">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Click to select PDF file</p>
                    <p className="text-gray-400 text-xs mt-1">PDF only · Max 50MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 50 * 1024 * 1024) { toast.error('File too large (max 50MB)'); return; }
                    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
                    setSelectedFile(file);
                  }
                }}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Material</>}
            </button>
          </form>
        </div>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No materials uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {materials.map((m) => (
            <div key={m.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 line-clamp-1">{m.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {m.course_code} · {m.level_name} · {m.semester_name} Semester · {m.session_name}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />{m.download_count} downloads</span>
                  <span>{new Date(m.created_at).toLocaleDateString('en-NG')}</span>
                </div>
              </div>
              <a
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
