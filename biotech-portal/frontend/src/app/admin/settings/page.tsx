'use client';

import { useEffect, useState, useRef } from 'react';
import { Save, Upload, Globe, CreditCard, Building2, Loader2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

interface Settings {
  [key: string]: string;
}

const SECTIONS = [
  {
    key: 'department',
    title: 'Department Information',
    icon: Building2,
    fields: [
      { key: 'dept_name', label: 'Department Name', type: 'text' },
      { key: 'faculty_name', label: 'Faculty Name', type: 'text' },
      { key: 'university_name', label: 'University Name', type: 'text' },
      { key: 'contact_email', label: 'Contact Email', type: 'email' },
      { key: 'contact_phone', label: 'Phone Number', type: 'text' },
      { key: 'office_address', label: 'Office Address', type: 'textarea' },
    ],
  },
  {
    key: 'payment',
    title: 'Payment Settings',
    icon: CreditCard,
    fields: [
      { key: 'dept_dues_amount', label: 'Departmental Dues (₦)', type: 'number' },
      { key: 'receipt_processing_fee', label: 'Receipt Processing Fee (₦)', type: 'number' },
      { key: 'paystack_public_key', label: 'Paystack Public Key', type: 'text' },
    ],
  },
  {
    key: 'portal',
    title: 'Portal Settings',
    icon: Globe,
    fields: [
      { key: 'portal_title', label: 'Portal Title', type: 'text' },
      { key: 'welcome_message', label: 'Welcome Message', type: 'textarea' },
    ],
  },
];

const BRANDING_FIELDS = [
  { key: 'dept_logo', label: 'Department Logo', hint: 'PNG/JPG, recommended 200×200px' },
  { key: 'faculty_logo', label: 'Faculty Logo', hint: 'PNG/JPG, recommended 200×200px' },
  { key: 'homepage_banner', label: 'Homepage Banner', hint: 'JPG/PNG, recommended 1920×600px' },
  { key: 'favicon', label: 'Website Favicon', hint: 'ICO/PNG, 32×32px' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    api.admin.getSettings()
      .then((res) => setSettings(res.data.settings || {}))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSection = async (section: typeof SECTIONS[0]) => {
    setSaving(section.key);
    const payload: Settings = {};
    section.fields.forEach((f) => {
      if (settings[f.key] !== undefined) payload[f.key] = settings[f.key];
    });
    try {
      await api.admin.updateBulkSettings(payload);
      toast.success(`${section.title} saved`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const handleBrandingUpload = async (key: string, file: File) => {
    setUploading(key);
    try {
      const res = await api.admin.uploadBranding(key, file);
      setSettings((prev) => ({ ...prev, [key]: res.data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Branding */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Upload className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-800 text-lg">Branding & Images</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {BRANDING_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
                {settings[field.key] && (
                  <img
                    src={settings[field.key]}
                    alt={field.label}
                    className="h-16 object-contain mb-3 mx-auto"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileRefs.current[field.key] = el; }}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBrandingUpload(field.key, file);
                  }}
                />
                <button
                  onClick={() => fileRefs.current[field.key]?.click()}
                  disabled={uploading === field.key}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  {uploading === field.key ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> {settings[field.key] ? 'Change' : 'Upload'}</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center mt-1">{field.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Sections */}
      {SECTIONS.map((section) => (
        <div key={section.key} className="card">
          <div className="flex items-center gap-2 mb-6">
            <section.icon className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-800 text-lg">{section.title}</h2>
          </div>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="input min-h-[80px]"
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="input"
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => handleSaveSection(section)}
              disabled={saving === section.key}
              className="btn-primary flex items-center gap-2"
            >
              {saving === section.key ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save {section.title}</>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
