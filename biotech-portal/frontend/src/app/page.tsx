'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

export default function HomePage() {
  const [stats, setStats] = useState({ total_materials: 0, total_payments: 0, total_downloads: 0, total_lecturers: 0 });
  const [settings, setSettings] = useState<any>({});
  const [materials, setMaterials] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(API + '/public/stats').then(r => r.json()),
      fetch(API + '/public/settings').then(r => r.json()),
      fetch(API + '/public/latest-materials').then(r => r.json()),
      fetch(API + '/public/announcements').then(r => r.json()),
    ]).then(([statsData, settingsData, materialsData, announcementsData]) => {
      setStats(statsData.data || {});
      setSettings(settingsData.data || {});
      setMaterials(materialsData.data || []);
      setAnnouncements(announcementsData.data || []);
    }).catch(() => {});
  }, []);

  const deptLogo = settings.department_logo || '';
  const fulLogo = settings.faculty_logo || '';
  const deptName = settings.department_name || 'Department of Biotechnology';
  const facultyName = settings.faculty_name || 'Faculty of Life Sciences';
  const uniName = settings.university_name || 'Federal University Lokoja';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          
          {/* Logo and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {fulLogo && (
              <img src={fulLogo} alt="FUL Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px' }} />
            )}
            {deptLogo && (
              <img src={deptLogo} alt="Dept Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px' }} />
            )}
            {!deptLogo && !fulLogo && (
              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px' }}>B</div>
            )}
            <div>
              <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0, lineHeight: 1.2 }}>{deptName}</p>
              <p style={{ color: '#bbf7d0', fontSize: '11px', margin: 0 }}>{uniName}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'none' }} className="desktop-nav">
              <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Home</Link>
              <Link href="/materials" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '14px', marginLeft: '20px' }}>Materials</Link>
              <Link href="/payment" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '14px', marginLeft: '20px' }}>Pay Dues</Link>
              <Link href="/receipt" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '14px', marginLeft: '20px' }}>Find Receipt</Link>
            </div>
            <Link href="/lecturer/login" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '13px' }}>Lecturer Login</Link>
            <Link href="/payment" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>Pay Dues</Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
              <span style={{ fontSize: '20px' }}>{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ background: '#14532d', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[['/', 'Home'], ['/materials', 'Materials'], ['/payment', 'Pay Dues'], ['/receipt', 'Find Receipt'], ['/lecturer/login', 'Lecturer Login']].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', color: 'white', textDecoration: 'none', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '14px' }}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #14532d, #15803d, #0f766e)', padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Logos in Hero */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            {fulLogo && (
              <img src={fulLogo} alt="FUL Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
            )}
            {deptLogo && (
              <img src={deptLogo} alt="Dept Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
            )}
          </div>

          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '6px 16px', color: '#bbf7d0', fontSize: '13px', marginBottom: '16px' }}>
            🛡️ Official Departmental Portal
          </div>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: '800', margin: '0 0 8px', lineHeight: 1.2 }}>{deptName}</h1>
          <p style={{ color: '#bbf7d0', fontSize: '16px', margin: '0 0 4px' }}>{facultyName}</p>
          <p style={{ color: '#86efac', fontSize: '14px', margin: '0 0 32px' }}>{uniName}</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <Link href="/payment" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Pay Departmental Dues
            </Link>
            <Link href="/materials" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '600', fontSize: '15px', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📚 Browse Materials
            </Link>
          </div>
          <Link href="/receipt" style={{ color: '#bbf7d0', fontSize: '13px', textDecoration: 'none' }}>
            📄 Already paid? Find your receipt
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1000px', margin: '-30px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Students Paid', value: stats.total_payments?.toLocaleString() || '0', icon: '💳' },
            { label: 'Materials', value: stats.total_materials?.toLocaleString() || '0', icon: '📚' },
            { label: 'Downloads', value: stats.total_downloads?.toLocaleString() || '0', icon: '⬇️' },
            { label: 'Lecturers', value: stats.total_lecturers?.toLocaleString() || '0', icon: '👨‍🏫' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { href: '/payment', icon: '💳', title: 'Pay Dues', desc: 'Pay your departmental dues online securely', color: '#f59e0b' },
            { href: '/materials', icon: '📚', title: 'Course Materials', desc: 'Access and download course materials', color: '#15803d' },
            { href: '/receipt', icon: '📄', title: 'Find Receipt', desc: 'Retrieve your payment receipt anytime', color: '#0f766e' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'flex', gap: '16px', alignItems: 'flex-start', transition: 'transform 0.2s', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <h3 style={{ fontWeight: '700', color: '#1f2937', margin: '0 0 4px', fontSize: '16px' }}>{item.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Materials */}
      {materials.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 40px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>Latest Materials</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {materials.slice(0, 6).map((m: any) => (
              <div key={m.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 6px', fontSize: '14px', lineHeight: 1.3 }}>{m.title}</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>{m.course_code} · {m.level_name} · {m.lecturer_name}</p>
                <Link href="/materials" style={{ color: '#15803d', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View Materials →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 40px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>Announcements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map((a: any) => (
              <div key={a.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 6px', fontSize: '15px' }}>{a.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 8px' }}>{a.content}</p>
                <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>{new Date(a.created_at).toLocaleDateString('en-NG')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lecturer CTA */}
      <div style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', padding: '48px 16px', textAlign: 'center', margin: '0 0 0' }}>
        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>Are you a Lecturer?</h2>
        <p style={{ color: '#bbf7d0', fontSize: '14px', margin: '0 0 24px' }}>Register to upload and share course materials with students</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/lecturer/register" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' }}>
            Register as Lecturer
          </Link>
          <Link href="/lecturer/login" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '2px solid rgba(255,255,255,0.3)' }}>
            Lecturer Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: '#9ca3af', padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ fontWeight: '600', color: 'white', marginBottom: '8px', fontSize: '15px' }}>{deptName}</p>
          <p style={{ fontSize: '13px', marginBottom: '4px' }}>{facultyName} · {uniName}</p>
          <p style={{ fontSize: '12px', marginTop: '16px' }}>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
