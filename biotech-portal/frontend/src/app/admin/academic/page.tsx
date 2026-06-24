'use client';

import { useEffect, useState } from 'react';
import { Plus, BookOpen, Layers, Calendar, RefreshCw } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface AcademicData {
  sessions: { id: number; session_name: string; is_active: boolean }[];
  levels: { id: number; level_name: string; level_number: number }[];
  semesters: { id: number; semester_name: string }[];
  courses: { id: number; course_code: string; course_title: string; level_name: string; semester_name: string }[];
}

export default function AdminAcademicPage() {
  const [data, setData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);

  // New Session
  const [newSession, setNewSession] = useState('');
  const [addingSession, setAddingSession] = useState(false);

  // New Course
  const [courseForm, setCourseForm] = useState({ course_code: '', course_title: '', level_id: '', semester_id: '' });
  const [addingCourse, setAddingCourse] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getAcademicData();
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSession = async () => {
    if (!newSession.trim()) return;
    setAddingSession(true);
    try {
      await api.admin.createAcademicSession({ session_name: newSession });
      toast.success('Session created');
      setNewSession('');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingSession(false);
    }
  };

  const handleAddCourse = async () => {
    if (!courseForm.course_code || !courseForm.course_title || !courseForm.level_id || !courseForm.semester_id) {
      toast.error('Fill all course fields');
      return;
    }
    setAddingCourse(true);
    try {
      await api.admin.createCourse(courseForm);
      toast.success('Course created');
      setCourseForm({ course_code: '', course_title: '', level_id: '', semester_id: '' });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingCourse(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Academic Setup</h2>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Sessions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-800">Academic Sessions</h3>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="e.g. 2024/2025"
              value={newSession}
              onChange={(e) => setNewSession(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
            />
            <button onClick={handleAddSession} disabled={addingSession} className="btn-primary px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data?.sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-gray-700">{s.session_name}</span>
                {s.is_active && (
                  <span className="badge-success badge text-xs">Active</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Levels */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-secondary-600" />
            <h3 className="font-semibold text-gray-800">Levels</h3>
          </div>
          <div className="space-y-2">
            {data?.levels.map((l) => (
              <div key={l.id} className="flex items-center p-2 rounded-lg bg-gray-50">
                <span className="text-gray-700">{l.level_name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Levels are predefined (100–500). Contact developer to modify.</p>
        </div>

        {/* Semesters */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-accent-500" />
            <h3 className="font-semibold text-gray-800">Semesters</h3>
          </div>
          <div className="space-y-2">
            {data?.semesters.map((s) => (
              <div key={s.id} className="flex items-center p-2 rounded-lg bg-gray-50">
                <span className="text-gray-700">{s.semester_name} Semester</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Course */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Add Course</h3>
          </div>
          <div className="space-y-3">
            <input
              className="input"
              placeholder="Course Code (e.g. BIO 201)"
              value={courseForm.course_code}
              onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
            />
            <input
              className="input"
              placeholder="Course Title"
              value={courseForm.course_title}
              onChange={(e) => setCourseForm({ ...courseForm, course_title: e.target.value })}
            />
            <select
              className="input"
              value={courseForm.level_id}
              onChange={(e) => setCourseForm({ ...courseForm, level_id: e.target.value })}
            >
              <option value="">Select Level</option>
              {data?.levels.map((l) => (
                <option key={l.id} value={l.id}>{l.level_name}</option>
              ))}
            </select>
            <select
              className="input"
              value={courseForm.semester_id}
              onChange={(e) => setCourseForm({ ...courseForm, semester_id: e.target.value })}
            >
              <option value="">Select Semester</option>
              {data?.semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.semester_name} Semester</option>
              ))}
            </select>
            <button onClick={handleAddCourse} disabled={addingCourse} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> {addingCourse ? 'Adding...' : 'Add Course'}
            </button>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Courses ({data?.courses.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Level</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {data?.courses.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono font-medium text-primary-700">{c.course_code}</td>
                  <td className="text-gray-700">{c.course_title}</td>
                  <td className="text-gray-600">{c.level_name}</td>
                  <td className="text-gray-600">{c.semester_name} Semester</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
