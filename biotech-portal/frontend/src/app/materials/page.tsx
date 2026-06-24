'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, FileText, BookOpen, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [academicData, setAcademicData] = useState<any>({ sessions: [], levels: [], semesters: [], courses: [], lecturers: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ level: '', semester: '', session: '', course_code: '', lecturer_id: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchMaterials = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page };
      const res = await api.getPublicMaterials(params);
      setMaterials(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (e) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAcademicData();
        setAcademicData(res.data.data);
      } catch (e) {}
    };
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchMaterials(1), 300);
    return () => clearTimeout(timer);
  }, [fetchMaterials]);

  const handleDownload = async (material: any) => {
    try {
      const res = await api.trackDownload(material.id);
      window.open(res.data.data.file_url, '_blank');
      toast.success('Download started!');
      // Update local count
      setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, download_count: m.download_count + 1 } : m));
    } catch (e) {
      toast.error('Failed to start download');
    }
  };

  const clearFilters = () => {
    setFilters({ level: '', semester: '', session: '', course_code: '', lecturer_id: '', search: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary-700 text-white py-4 px-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 text-green-200 hover:text-white text-sm">
              <ChevronLeft size={16} /> Home
            </Link>
            <h1 className="font-heading font-bold text-lg">Study Materials</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-all ${showFilters ? 'bg-white text-primary-700' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="input pl-10 py-3 text-base"
            placeholder="Search by title, course code or description..."
          />
          {filters.search && (
            <button onClick={() => setFilters(f => ({ ...f, search: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Filter Materials</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X size={12} /> Clear All
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="label text-xs">Level</label>
                <select value={filters.level} onChange={(e) => setFilters(f => ({ ...f, level: e.target.value }))} className="input">
                  <option value="">All Levels</option>
                  {academicData.levels.map((l: any) => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Semester</label>
                <select value={filters.semester} onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value }))} className="input">
                  <option value="">All Semesters</option>
                  {academicData.semesters.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Academic Session</label>
                <select value={filters.session} onChange={(e) => setFilters(f => ({ ...f, session: e.target.value }))} className="input">
                  <option value="">All Sessions</option>
                  {academicData.sessions.map((s: any) => <option key={s.id} value={s.session_name}>{s.session_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Course</label>
                <select value={filters.course_code} onChange={(e) => setFilters(f => ({ ...f, course_code: e.target.value }))} className="input">
                  <option value="">All Courses</option>
                  {academicData.courses.map((c: any) => <option key={c.course_code} value={c.course_code}>{c.course_code} – {c.course_title}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Lecturer</label>
                <select value={filters.lecturer_id} onChange={(e) => setFilters(f => ({ ...f, lecturer_id: e.target.value }))} className="input">
                  <option value="">All Lecturers</option>
                  {academicData.lecturers.map((l: any) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${pagination.total} material${pagination.total !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary-700" size={32} />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="mx-auto text-gray-200 mb-4" size={48} />
            <h3 className="font-semibold text-gray-400 mb-2">No materials found</h3>
            <p className="text-sm text-gray-400">Try adjusting your filters or search term</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary text-sm mt-4">Clear Filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <div key={material.id} className="card hover:shadow-card-hover transition-all group">
                  {/* File icon */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="text-red-500" size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{material.title}</h3>
                      <span className="text-xs font-bold text-primary-700 bg-green-50 px-2 py-0.5 rounded-full">{material.course_code}</span>
                    </div>
                  </div>

                  {material.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{material.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {material.level_name && <span className="badge-success text-xs">{material.level_name}</span>}
                    {material.semester_name && <span className="badge-info text-xs">{material.semester_name}</span>}
                    {material.session_name && <span className="badge-pending text-xs">{material.session_name}</span>}
                  </div>

                  <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{material.lecturer_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Download size={10} /> {material.download_count} downloads</span>
                        {material.file_size && <span>{formatFileSize(material.file_size)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex items-center gap-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all active:scale-95"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => fetchMaterials(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
                <button
                  onClick={() => fetchMaterials(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary text-sm flex items-center gap-1 disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
