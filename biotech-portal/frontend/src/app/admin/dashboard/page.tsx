'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, Users, FileText, Download, TrendingUp,
  Activity, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  cards: {
    total_revenue: number;
    total_payments: number;
    total_lecturers: number;
    total_materials: number;
    total_downloads: number;
    pending_lecturers: number;
  };
  charts: {
    daily: { date: string; revenue: number; count: number }[];
    weekly: { week: string; revenue: number; count: number }[];
    monthly: { month: string; revenue: number; count: number }[];
    annual: { year: string; revenue: number; count: number }[];
  };
  recent_activity: {
    type: string;
    description: string;
    created_at: string;
  }[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

const StatCard = ({
  title, value, icon: Icon, color, sub,
}: {
  title: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const activityIcon = (type: string) => {
  if (type === 'payment') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (type === 'lecturer_register') return <Clock className="w-4 h-4 text-yellow-500" />;
  if (type === 'lecturer_approved') return <CheckCircle className="w-4 h-4 text-blue-500" />;
  if (type === 'lecturer_rejected') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Activity className="w-4 h-4 text-gray-400" />;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { cards, charts, recent_activity } = stats;
  const chartData = charts[chartView] || [];
  const xKey = chartView === 'daily' ? 'date' : chartView === 'weekly' ? 'week' : chartView === 'monthly' ? 'month' : 'year';

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(cards.total_revenue)}
          icon={DollarSign}
          color="bg-primary-600"
        />
        <StatCard
          title="Total Payments"
          value={cards.total_payments.toLocaleString()}
          icon={TrendingUp}
          color="bg-secondary-600"
        />
        <StatCard
          title="Lecturers"
          value={cards.total_lecturers}
          icon={Users}
          color="bg-accent-500"
          sub={`${cards.pending_lecturers} pending`}
        />
        <StatCard
          title="Materials"
          value={cards.total_materials}
          icon={FileText}
          color="bg-blue-600"
        />
        <StatCard
          title="Downloads"
          value={cards.total_downloads.toLocaleString()}
          icon={Download}
          color="bg-purple-600"
        />
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Revenue Overview</h2>
          <div className="flex gap-2 flex-wrap">
            {(['daily', 'weekly', 'monthly', 'annual'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  chartView === v
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#006400" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payments Line Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Payment Volume</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [v, 'Payments']} />
            <Line
              type="monotone"
              dataKey="count"
              name="Payments"
              stroke="#0F766E"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        {recent_activity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recent_activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="mt-0.5">{activityIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.created_at).toLocaleString('en-NG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
