'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, FileText, CreditCard, Settings,
  LogOut, Menu, X, Bell, ChevronRight, Megaphone, GraduationCap,
  BookOpen, Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/lecturers', label: 'Lecturers', icon: Users },
  { href: '/admin/materials', label: 'Materials', icon: BookOpen },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/receipts', label: 'Receipts', icon: FileText },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/academic', label: 'Academic Setup', icon: GraduationCap },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!isAuthenticated || !user || !['admin', 'super_admin'].includes(user.role)) {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, pathname, router]);

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:relative lg:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={18} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Admin Portal</p>
              <p className="text-gray-400 text-xs">Biotechnology Dept.</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-700 text-white border-r-2 border-accent'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon size={17} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-gray-400 text-xs">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm transition-colors w-full">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Menu size={20} />
            </button>
            <nav className="hidden sm:flex items-center text-sm text-gray-500">
              <Link href="/admin/dashboard" className="hover:text-primary-700">Admin</Link>
              <ChevronRight size={14} className="mx-1" />
              <span className="text-gray-900 font-medium capitalize">
                {pathname.split('/').filter(Boolean).slice(1).join(' › ')}
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs text-gray-400 hover:text-primary-700 transition-colors">
              View Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
