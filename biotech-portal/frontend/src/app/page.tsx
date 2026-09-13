'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://biotech-portal-backend.onrender.com/api';

export default function HomePage() {
  const [settings, setSettings] = useState<any>({});
  const [materials, setMaterials] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(API + '/public/settings').then(r => r.json()),
      fetch(API + '/public/latest-materials').then(r => r.json()),
      fetch(API + '/public/announcements').then(r => r.json()),
    ]).then(([settingsData, materialsData, announcementsData]) => {
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

  const quotes = [
    '🧬 Biotechnology: Harnessing the power of life to improve lives',
    '🔬 Where science meets innovation — shaping the future of medicine and agriculture',
    '🌱 Biotechnology is the science of tomorrow, studied today',
    '💡 Transforming biological knowledge into solutions for humanity',
    '🧪 The future belongs to those who understand the language of genes',
    '🌍 Biotechnology: Feeding the world, healing the sick, protecting the environment',
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused; }
        .desktop-links { display: flex; align-items: center; gap: 20px; }
        .hamburger { display: none; }
        .mobile-menu { display: none; }
        .hero-logos { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; }
        .hero-title { font-size: 32px; }
        .quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .materials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .hamburger { display: block !important; }
          .mobile-menu-open { display: block !important; }
          .hero-logos { gap: 12px; margin-bottom: 16px; }
          .hero-title { font-size: 22px !important; }
          .quick-grid { grid-template-columns: 1fr !important; }
          .materials-grid { grid-template-columns: 1fr !important; }
          .cta-buttons { flex-direction: column !important; align-items: stretch !important; }
          .cta-buttons a { text-align: center; }
          .lecturer-buttons { flex-direction: column !important; align-items: stretch !important; }
          .lecturer-buttons a { text-align: center; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 20px !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          
          {/* Logo + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            {fulLogo && (
              <img src={fulLogo} alt="FUL" style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px', flexShrink: 0 }} />
            )}
            {deptLogo && (
              <img src={deptLogo} alt="Dept" style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'white', fontWeight: '700', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deptName}</p>
              <p style={{ color: '#bbf7d0', fontSize: '10px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uniName}</p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="desktop-links">
            {[['/', 'Home'], ['/materials', 'Materials'], ['/payment', 'Pay Dues'], ['/receipt', 'Receipt'], ['/lecturer/login', 'Lecturer']].map(([href, label]) => (
              <Link key={href} href={href} style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '13px', whiteSpace: 'nowrap' }}>{label}</Link>
            ))}
            <Link href="/payment" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>Pay Now</Link>
          </div>

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', fontSize: '22px', flexShrink: 0 }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ background: '#14532d', padding: '8px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[['/', 'Home'], ['/materials', 'Materials'], ['/payment', 'Pay Dues'], ['/receipt', 'Find Receipt'], ['/lecturer/login', 'Lecturer Login'], ['/lecturer/register', 'Register as Lecturer']].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', color: 'white', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '14px' }}>
                {label}
              </Link>
            ))}
            <Link href="/payment" onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'block', background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center', marginTop: '12px' }}>
              💳 Pay Dues Now
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #14532d, #15803d, #0f766e)', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          
          {/* Logos */}
          <div className="hero-logos">
            {fulLogo && (
              <img src={fulLogo} alt="FUL Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
            )}
            {deptLogo && (
              <img src={deptLogo} alt="Dept Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />
            )}
          </div>

          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '5px 14px', color: '#bbf7d0', fontSize: '12px', marginBottom: '12px' }}>
            🛡️ Official Departmental Portal
          </div>
          <h1 className="hero-title" style={{ color: 'white', fontWeight: '800', margin: '0 0 6px', lineHeight: 1.2 }}>{deptName}</h1>
          <p style={{ color: '#bbf7d0', fontSize: '14px', margin: '0 0 2px' }}>{facultyName}</p>
          <p style={{ color: '#86efac', fontSize: '13px', margin: '0 0 28px' }}>{uniName}</p>

          <div className="cta-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
            <Link href="/payment" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '13px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px' }}>
              💳 Pay Departmental Dues
            </Link>
            <Link href="/materials" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', padding: '13px 24px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: '2px solid rgba(255,255,255,0.3)' }}>
              📚 Browse Materials
            </Link>
          </div>
          <Link href="/receipt" style={{ color: '#bbf7d0', fontSize: '13px', textDecoration: 'none' }}>
            📄 Already paid? Find your receipt
          </Link>
        </div>
      </div>

      {/* Animated Quote Ticker */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb', padding: '10px 0', overflow: 'hidden' }}>
        <div className="marquee-track">
          {[...quotes, ...quotes].map((quote, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '48px', whiteSpace: 'nowrap' }}>
              <div style={{ width: '5px', height: '5px', background: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ color: '#15803d', fontSize: '13px', fontWeight: '600' }}>{quote}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', textAlign: 'center' }}>Quick Actions</h2>
        <div className="quick-grid">
          {[
            { href: '/payment', icon: '💳', title: 'Pay Dues', desc: 'Pay your departmental dues online securely' },
            { href: '/materials', icon: '📚', title: 'Course Materials', desc: 'Access and download course materials' },
            { href: '/receipt', icon: '📄', title: 'Find Receipt', desc: 'Retrieve your payment receipt anytime' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'flex', gap: '14px', alignItems: 'flex-start', height: '100%' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <h3 style={{ fontWeight: '700', color: '#1f2937', margin: '0 0 4px', fontSize: '15px' }}>{item.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '12px', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Materials */}
      {materials.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 32px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', textAlign: 'center' }}>Latest Materials</h2>
          <div className="materials-grid">
            {materials.slice(0, 6).map((m: any) => (
              <div key={m.id} style={{ background: 'white', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>📄</div>
                <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 6px', fontSize: '13px', lineHeight: 1.3 }}>{m.title}</h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 10px' }}>{m.course_code} · {m.level_name}</p>
                <Link href="/materials" style={{ color: '#15803d', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>View →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 32px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', textAlign: 'center' }}>Announcements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map((a: any) => (
              <div key={a.id} style={{ background: 'white', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 6px', fontSize: '14px' }}>{a.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 6px' }}>{a.content}</p>
                <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>{new Date(a.created_at).toLocaleDateString('en-NG')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lecturer CTA */}
      <div style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', padding: '40px 16px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Are you a Lecturer?</h2>
        <p style={{ color: '#bbf7d0', fontSize: '13px', margin: '0 0 20px' }}>Register to upload and share course materials with students</p>
        <div className="lecturer-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/lecturer/register" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' }}>
            Register as Lecturer
          </Link>
          <Link href="/lecturer/login" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '2px solid rgba(255,255,255,0.3)' }}>
            Lecturer Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: '#9ca3af', padding: '28px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ fontWeight: '600', color: 'white', marginBottom: '6px', fontSize: '14px' }}>{deptName}</p>
          <p style={{ fontSize: '12px', marginBottom: '4px' }}>{facultyName} · {uniName}</p>
          <p style={{ fontSize: '11px', marginTop: '12px' }}>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </footer>

    </div>
  );
}
