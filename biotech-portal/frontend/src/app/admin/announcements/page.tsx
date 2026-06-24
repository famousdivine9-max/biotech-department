'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Megaphone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  expires_at: string | null;
  created_at: string;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'badge-success',
  high: 'badge-danger',
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    title: string; content: string; priority: string; expires_at: string;
  }>();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getAnnouncements();
      setAnnouncements(res.data.announcements);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.admin.createAnnouncement(data);
      toast.success('Announcement created');
      reset();
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    setDeleting(id);
    try {
      await api.admin.deleteAnnouncement(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Announcements</h2>
        <div className="flex gap-2">
          <button onClick={fetchAnnouncements} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Create Announcement</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input {...register('title', { required: true })} className="input" placeholder="Announcement title" />
            </div>
            <div>
              <label className="label">Content</label>
              <textarea
                {...register('content', { required: true })}
                className="input min-h-[100px]"
                placeholder="Write your announcement..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <select {...register('priority')} className="input">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="label">Expires At (optional)</label>
                <input {...register('expires_at')} type="date" className="input" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-12">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge text-xs ${priorityColors[a.priority]}`}>
                      {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)} Priority
                    </span>
                    {a.expires_at && (
                      <span className="text-xs text-gray-400">
                        Expires: {new Date(a.expires_at).toLocaleDateString('en-NG')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{a.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(a.created_at).toLocaleString('en-NG')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleting === a.id}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
