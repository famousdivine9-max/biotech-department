'use client';

import { useEffect, useState } from 'react';
import {
  Search, CheckCircle, XCircle, PauseCircle, Trash2,
  Key, RefreshCw, ChevronLeft, ChevronRight, User,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface Lecturer {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  staff_id: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  material_count: number;
}

const statusColors = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  suspended: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getLecturers({ search, status: statusFilter, page, limit });
      setLecturers(res.data.lecturers);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLecturers(); }, [search, statusFilter, page]);

  const handleAction = async (
    id: number,
    action: 'approve' | 'reject' | 'suspend' | 'delete' | 'reset',
  ) => {
    if (action === 'delete' && !confirm('Delete this lecturer? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      if (action === 'delete') {
        await api.admin.deleteLecturer(id);
        toast.success('Lecturer deleted');
        fetchLecturers();
      } else if (action === 'reset') {
        const res = await api.admin.resetLecturerPassword(id);
        toast.success(`Temporary password: ${res.data.temp_password}`);
      } else {
        await api.admin.updateLecturerStatus(id, action);
        toast.success(`Lecturer ${action}d`);
        fetchLecturers();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
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
              placeholder="Search by name, email, staff ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={fetchLecturers} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Lecturers ({total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lecturer</th>
                <th>Staff ID</th>
                <th>Phone</th>
                <th>Materials</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : lecturers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No lecturers found</td></tr>
              ) : lecturers.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{l.full_name}</p>
                        <p className="text-xs text-gray-400">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{l.staff_id}</td>
                  <td className="text-gray-600">{l.phone_number}</td>
                  <td className="text-gray-600">{l.material_count}</td>
                  <td>
                    <span className={`badge ${statusColors[l.status]}`}>
                      {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-gray-500 text-sm">
                    {new Date(l.created_at).toLocaleDateString('en-NG')}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {l.status === 'pending' && (
                        <>
                          <ActionBtn
                            title="Approve"
                            icon={<CheckCircle className="w-4 h-4" />}
                            color="text-green-600 hover:bg-green-50"
                            loading={actionLoading === l.id}
                            onClick={() => handleAction(l.id, 'approve')}
                          />
                          <ActionBtn
                            title="Reject"
                            icon={<XCircle className="w-4 h-4" />}
                            color="text-red-600 hover:bg-red-50"
                            loading={actionLoading === l.id}
                            onClick={() => handleAction(l.id, 'reject')}
                          />
                        </>
                      )}
                      {l.status === 'approved' && (
                        <ActionBtn
                          title="Suspend"
                          icon={<PauseCircle className="w-4 h-4" />}
                          color="text-orange-600 hover:bg-orange-50"
                          loading={actionLoading === l.id}
                          onClick={() => handleAction(l.id, 'suspend')}
                        />
                      )}
                      {(l.status === 'rejected' || l.status === 'suspended') && (
                        <ActionBtn
                          title="Approve"
                          icon={<CheckCircle className="w-4 h-4" />}
                          color="text-green-600 hover:bg-green-50"
                          loading={actionLoading === l.id}
                          onClick={() => handleAction(l.id, 'approve')}
                        />
                      )}
                      <ActionBtn
                        title="Reset Password"
                        icon={<Key className="w-4 h-4" />}
                        color="text-blue-600 hover:bg-blue-50"
                        loading={actionLoading === l.id}
                        onClick={() => handleAction(l.id, 'reset')}
                      />
                      <ActionBtn
                        title="Delete"
                        icon={<Trash2 className="w-4 h-4" />}
                        color="text-red-600 hover:bg-red-50"
                        loading={actionLoading === l.id}
                        onClick={() => handleAction(l.id, 'delete')}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  title, icon, color, loading, onClick,
}: {
  title: string; icon: React.ReactNode; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-colors ${color} disabled:opacity-50`}
    >
      {icon}
    </button>
  );
}
