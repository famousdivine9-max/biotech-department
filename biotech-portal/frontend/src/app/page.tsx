'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen, CreditCard, Download, Users, Bell, Phone, Mail,
  MapPin, ArrowRight, ChevronRight, FileText, TrendingUp, Shield,
  Clock, Star, Menu, X
} from 'lucide-react';
import { api } from '@/lib/api';

export default function HomePage() {
  const [stats, setStats] = useState({ total_materials: 0, total_payments: 0, total_downloads: 0, total_lecturers: 0 });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [latestMaterials, setLatestMaterials] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, settingsRes, materialsRes, announcementsRes] = await Promise.all([
          api.getPublicStats(),
          api.getPublicSettings(),
          api.getLatestMaterials(),
          api.getPublicAnnouncements(),
        ]);
        setStats(statsRes.data.data);
        setSettings(settingsRes.data.data);
        setLatestMaterials(materialsRes.data.data || []);
        setAnnouncements(announcementsRes.data.data || []);
      } catch (e) {
        // Use defaults
      }
    };
    fetchData();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const deptName = settings.department_name || 'Department of Biotechnology';
  const facultyName = settings.faculty_name || 'Faculty of Life Sciences';
  const uniName = settings.university_name || 'Federal University Lokoja';

  return (
    <div className="min-h-screen bg-background">
      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.department_logo ? (
              <Image src={settings.department_logo} alt="Logo" width={44} height={44} className="rounded-lg object-contain" />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
            )}
            <div>
              <p className={`font-heading font-bold text-sm leading-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                {deptName}
              </p>
              <p className={`text-xs ${scrolled ? 'text-gray-500' : 'text-green-200'}`}>{uniName}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Home', href: '/' },
              { label: 'Materials', href: '/materials' },
              { label: 'Pay Dues', href: '/payment' },
              { label: 'Find Receipt', href: '/receipt' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${scrolled ? 'text-gray-700' : 'text-green-100'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/lecturer/login" className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${scrolled ? 'text-primary-700 hover:bg-green-50' : 'text-white hover:bg-white/10'}`}>
              Lecturer Login
            </Link>
            <Link href="/payment" className="btn-accent text-sm">
              Pay Dues
            </Link>
          </div>

          <button
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {[
              { label: 'Home', href: '/' },
              { label: 'Materials', href: '/materials' },
              { label: 'Pay Dues', href: '/payment' },
              { label: 'Find Receipt', href: '/receipt' },
              { label: 'Lecturer Login', href: '/lecturer/login' },
              { label: 'Admin', href: '/admin/login' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block text-sm font-medium text-gray-700 py-2" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-secondary"
          style={{
            backgroundImage: settings.homepage_banner ? `url(${settings.homepage_banner})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {settings.homepage_banner && <div className="absolute inset-0 bg-primary-700/70" />}

        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />

        <div className="relative z-10 container mx-auto px-4 text-center py-32">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Shield size={14} />
            Official Departmental Portal
          </div>

          {settings.department_logo && (
            <div className="flex justify-center mb-6">
              <Image src={settings.department_logo} alt="Dept Logo" width={80} height={80} className="rounded-2xl shadow-lg" />
            </div>
          )}

          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {deptName}
          </h1>
          <p className="text-green-200 text-lg md:text-xl mb-2">{facultyName}</p>
          <p className="text-green-300 text-base mb-10">{uniName}</p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/payment" className="btn-accent flex items-center gap-2 text-base px-7 py-3 shadow-lg shadow-amber-500/25">
              <CreditCard size={18} />
              Pay Departmental Dues
            </Link>
            <Link href="/materials" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-base px-7 py-3 rounded-lg shadow hover:bg-gray-50 transition-all">
              <BookOpen size={18} />
              Browse Materials
            </Link>
          </div>

          <div className="mt-8">
            <Link href="/receipt" className="text-green-200 text-sm hover:text-white transition-colors flex items-center gap-1 justify-center">
              <FileText size={14} />
              Already paid? Find your receipt
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: stats.total_materials.toLocaleString(), label: 'Materials Uploaded', icon: BookOpen, color: 'text-primary-700', bg: 'bg-green-50' },
              { value: stats.total_payments.toLocaleString(), label: 'Payments Processed', icon: CreditCard, color: 'text-secondary', bg: 'bg-teal-50' },
              { value: stats.total_downloads.toLocaleString(), label: 'Student Downloads', icon: Download, color: 'text-accent-dark', bg: 'bg-amber-50' },
              { value: stats.total_lecturers.toLocaleString(), label: 'Active Lecturers', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-card-hover transition-shadow">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`${stat.color}`} size={22} />
                </div>
                <div className={`text-3xl font-bold ${stat.color} font-heading`}>{stat.value}+</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS CARDS ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">What would you like to do?</h2>
            <p className="text-gray-500">Access all departmental services in one place</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: CreditCard,
                title: 'Pay Dues',
                desc: 'Pay your departmental dues securely online using Paystack. Get an instant receipt.',
                href: '/payment',
                color: 'bg-primary-700',
                light: 'bg-green-50 text-primary-700',
                cta: 'Pay Now',
              },
              {
                icon: BookOpen,
                title: 'Download Materials',
                desc: 'Access lecture notes, PDFs and study materials uploaded by your lecturers.',
                href: '/materials',
                color: 'bg-secondary',
                light: 'bg-teal-50 text-secondary',
                cta: 'Browse Materials',
              },
              {
                icon: FileText,
                title: 'Find Receipt',
                desc: 'Misplaced your payment receipt? Search and re-download your official receipt anytime.',
                href: '/receipt',
                color: 'bg-accent-dark',
                light: 'bg-amber-50 text-amber-700',
                cta: 'Find Receipt',
              },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="card hover:shadow-card-hover transition-all group cursor-pointer block">
                <div className={`w-12 h-12 ${card.light} rounded-xl flex items-center justify-center mb-4`}>
                  <card.icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{card.desc}</p>
                <span className={`inline-flex items-center gap-1 text-sm font-semibold text-primary-700 group-hover:gap-2 transition-all`}>
                  {card.cta} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST MATERIALS ── */}
      {latestMaterials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="section-title mb-1">Latest Materials</h2>
                <p className="text-gray-500 text-sm">Recently uploaded study resources</p>
              </div>
              <Link href="/materials" className="btn-secondary text-sm flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestMaterials.map((material) => (
                <div key={material.id} className="group border border-gray-100 rounded-xl p-5 hover:shadow-card-hover hover:border-primary-200 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-red-500" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{material.title}</p>
                      <p className="text-xs text-primary-700 font-medium mt-0.5">{material.course_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{material.lecturer_name}</span>
                    <span className="flex items-center gap-1">
                      <Download size={11} /> {material.download_count}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 text-xs">
                    {material.level_name && <span className="badge-success">{material.level_name}</span>}
                    {material.semester_name && <span className="badge-info">{material.semester_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {announcements.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-primary-700 to-secondary">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Bell className="text-accent" size={24} />
              <h2 className="text-2xl font-heading font-bold text-white">Announcements</h2>
            </div>
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-1">{a.title}</h3>
                  <p className="text-green-100 text-sm">{a.content}</p>
                  <p className="text-green-300 text-xs mt-2">
                    <Clock size={11} className="inline mr-1" />
                    {new Date(a.published_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LECTURER SECTION ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="text-white" size={28} />
            </div>
            <h2 className="section-title mb-3">Lecturer Portal</h2>
            <p className="text-gray-500 mb-8">
              Upload lecture materials and make them accessible to students. Create an account and get approved by the administrator.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/lecturer/register" className="btn-primary">
                Create Account
              </Link>
              <Link href="/lecturer/login" className="btn-secondary">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT / FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <h3 className="text-white font-heading font-bold text-lg mb-4">{deptName}</h3>
              <p className="text-sm leading-relaxed">{facultyName}, {uniName}. Dedicated to advancing knowledge in biological sciences and biotechnology.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Pay Dues', href: '/payment' },
                  { label: 'Study Materials', href: '/materials' },
                  { label: 'Find Receipt', href: '/receipt' },
                  { label: 'Lecturer Portal', href: '/lecturer/login' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-accent transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                {settings.contact_email && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} className="text-accent flex-shrink-0" />
                    <a href={`mailto:${settings.contact_email}`} className="hover:text-accent transition-colors">{settings.contact_email}</a>
                  </li>
                )}
                {settings.contact_phone && (
                  <li className="flex items-center gap-2">
                    <Phone size={14} className="text-accent flex-shrink-0" />
                    <span>{settings.contact_phone}</span>
                  </li>
                )}
                {settings.office_address && (
                  <li className="flex items-start gap-2">
                    <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" />
                    <span>{settings.office_address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs">&copy; {new Date().getFullYear()} {deptName}. All rights reserved.</p>
            <div className="flex gap-4 text-xs">
              <Link href="/admin/login" className="hover:text-gray-200 transition-colors">Admin Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
