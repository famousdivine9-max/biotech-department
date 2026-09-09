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
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {fulLogo && <img src={fulLogo} alt="FUL" style={{ width: '38px', height: '38px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px' }} />}
            {deptLogo && <img src={deptLogo} alt="Dept" style={{ width: '38px', height: '38px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px' }} />}
            {!deptLogo && !fulLogo && (
              <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>B</div>
            )}
            <div>
              <p style={{ color: 'white', fontWeight: '700', fontSize: '13px', margin: 0 }}>{deptName}</p>
              <p style={{ color: '#bbf7d0', fontSize: '10px', margin: 0 }}>{uniName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>Home</Link>
            <Link href="/materials" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '13px' }}>Materials</Link>
            <Link href="/payment" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '13px' }}>Pay Dues</Link>
            <Link href="/receipt" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '13px' }}>Receipt</Link>
            <Link href="/lecturer/login" style={{ color: '#bbf7d0', textDecoration: 'none', fontSize: '13px' }}>Lecturer</Link>
            <Link href="/payment" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>Pay Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #14532d, #15803d, #0f766e)', padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            {fulLogo && <img src={fulLogo} alt="FUL Logo" style={{ width: '72px', height: '72px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />}
            {deptLogo && <img src={deptLogo} alt="Dept Logo" style={{ width: '72px', height: '72px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} />}
          </div>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '6px 16px', color: '#bbf7d0', fontSize: '13px', marginBottom: '16px' }}>
            🛡️ Official Departmental Portal
          </div>
          <h1 style={{ color: 'white', fontSize: '34px', fontWeight: '800', margin: '0 0 8px', lineHeight: 1.2 }}>{deptName}</h1>
          <p style={{ color: '#bbf7d0', fontSize: '16px', margin: '0 0 4px' }}>{facultyName}</p>
          <p style={{ color: '#86efac', fontSize: '14px', margin: '0 0 32px' }}>{uniName}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <Link href="/payment" style={{ background: '#f59e0b', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '15px' }}>
              💳 Pay Departmental Dues
            </Link>
            <Link href="/materials" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '600', fontSize: '15px', border: '2px solid rgba(255,255,255,0.3)' }}>
              📚 Browse Materials
            </Link>
          </div>
          <Link href="/receipt" style={{ color: '#bbf7d0', fontSize: '13px', textDecoration: 'none' }}>
            📄 Already paid? Find your receipt
          </Link>
        </div>
      </div>

      {/* Animated Quote Ticker */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb', padding: '12px 0', overflow: 'hidden' }}>
        <div className="marquee-track">
          {[...quotes, ...quotes].map((quote, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '60px', whiteSpace: 'nowrap' }}>
              <div style={{ width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} />
              <span style={{ color: '#15803d', fontSize: '13px', fontWeight: '600' }}>{quote}</span>
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
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'flex', gap: '16px', alignItems: 'flex-start', cursor: 'pointer' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #14532d, #15803d)', padding: '48px 16px', textAlign: 'center' }}>
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
