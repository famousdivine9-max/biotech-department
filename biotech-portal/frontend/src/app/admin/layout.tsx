'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, Users, FileText, DollarSign, Receipt, Megaphone, BookOpen, Settings, LogOut, Menu, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/lecturers', icon: Users, label: 'Lecturers' },
  { href: '/admin/materials', icon: FileText, label: 'Materials' },
  { href: '/admin/payments', icon: DollarSign, label: 'Payments' },
  { href: '/admin/receipts', icon: Receipt, label: 'Receipts' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { href: '/admin/academic', icon: BookOpen, label: 'Academic Setup' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const PUBLIC_PATHS = ['/admin/login'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    setMounted(true);
    if (!isPublicPath) {
      const token = localStorage.getItem('biotech_token');
      const userStr = localStorage.getItem('biotech_user');
      if (!token) {
        router.push('/admin/login');
      } else if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {}
      }
    }
  }, [isPublicPath, pathname]);

  if (!mounted) return null;

  if (isPublicPath) {
    return <>{children}</>;
  }

  const token = localStorage.getItem('biotech_token');
  if (!token) return null;

  const handleLogout = () => {
    localStorage.removeItem('biotech_token');
    localStorage.removeItem('biotech_user');
    router.push('/admin/login');
  };

  const breadcrumb = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label || '';

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Admin Portal</p>
              <p className="text-xs text-gray-500">Biotechnology · FUL</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <item.icon className={`w-4 h-4 ${active ? 'text-primary-600' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-sm">
                {user?.full_name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Admin</span>
            {breadcrumb && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-800 font-medium">{breadcrumb}</span>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
