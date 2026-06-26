'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, LayoutDashboard, FileText, LogOut, Menu, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/lecturer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/lecturer/materials', icon: FileText, label: 'My Materials' },
];

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Lecturer');
  const [userEmail, setUserEmail] = useState('');
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const isPublicPath = pathname.includes('/login') || pathname.includes('/register');

  useEffect(() => {
    try {
      const token = localStorage.getItem('biotech_token');
      const userStr = localStorage.getItem('biotech_user');
      if (token) {
        setAuthed(true);
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || user.full_name || 'Lecturer');
          setUserEmail(user.email || '');
        }
      } else if (!isPublicPath) {
        router.push('/lecturer/login');
      }
    } catch (e) {
      if (!isPublicPath) router.push('/lecturer/login');
    }
    setChecked(true);
  }, []);

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '4px solid #15803d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (isPublicPath) return <>{children}</>;

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '4px solid #15803d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem('biotech_token');
    localStorage.removeItem('biotech_user');
    window.location.href = '/lecturer/login';
  };

  const breadcrumb = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }} />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: '256px',
        background: 'white', borderRight: '1px solid #e5e7eb', zIndex: 30,
        display: 'flex', flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s'
      }}
        className="lg-sidebar">
        <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: '#15803d', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <p style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px', margin: 0 }}>Lecturer Portal</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Biotechnology · FUL</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px' }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                  borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
                  marginBottom: '4px',
                  background: active ? '#f0fdf4' : 'transparent',
                  color: active ? '#15803d' : '#6b7280'
                }}>
                <item.icon style={{ width: '16px', height: '16px' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#15803d', fontWeight: '600', fontSize: '14px' }}>{userName.charAt(0)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            <LogOut style={{ width: '16px', height: '16px' }} /> Sign Out
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '0' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
            <Menu style={{ width: '20px', height: '20px' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6b7280' }}>
            <span>Lecturer</span>
            {breadcrumb && (
              <>
                <ChevronRight style={{ width: '16px', height: '16px' }} />
                <span style={{ color: '#1f2937', fontWeight: '500' }}>{breadcrumb}</span>
              </>
            )}
          </div>
        </header>
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
