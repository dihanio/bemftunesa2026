"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { DocumentTable } from '@/components/document/DocumentTable';
import { TemplateStatusBadge } from '@/components/document/TemplateStatusBadge';
import { Template, templateApi } from '@/lib/api/templates';
import ImsApiService, { type UserProfile } from '@/lib/api';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui';
import { Plus, RefreshCw, LayoutTemplate, X, AlertCircle } from 'lucide-react';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Role authorization
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    name: '',
    documentType: 'surat',
    category: 'internal',
    googleDriveUrl: '',
    description: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchTemplates();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await ImsApiService.getProfile();
      if (res?.data) {
        const roleObj = typeof res.data.role === 'object' ? res.data.role : null;
        const roleSlug = res.data.activeContext?.role?.slug || roleObj?.slug || (typeof res.data.role === 'string' ? res.data.role : 'staf');
        setIsAuthorized(['super-admin', 'sekretaris'].includes(roleSlug));
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await templateApi.getAll();
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.googleDriveUrl) {
      setSyncError('Harap isi semua kolom wajib (*)');
      return;
    }

    setSyncLoading(true);
    setSyncError(null);
    try {
      await templateApi.sync(form);
      setIsModalOpen(false);
      // Reset form
      setForm({
        code: '',
        name: '',
        documentType: 'surat',
        category: 'internal',
        googleDriveUrl: '',
        description: ''
      });
      fetchTemplates();
    } catch (err: any) {
      console.error('Failed to sync template:', err);
      setSyncError(err.message || 'Gagal melakukan sinkronisasi template dari Google Drive.');
    } finally {
      setSyncLoading(false);
    }
  };

  const columns = [
    {
      header: 'Code / Name',
      accessor: (item: Template) => (
        <div>
          <div className="font-medium text-white">{item.name}</div>
          <div className="text-xs text-foreground/50">{item.code}</div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (item: Template) => (
        <span className="capitalize">{item.documentType}</span>
      ),
    },
    {
      header: 'Category',
      accessor: (item: Template) => item.category,
    },
    {
      header: 'Version',
      accessor: (item: Template) => (
        <span className="text-sage font-medium">v{item.version}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (item: Template) => <TemplateStatusBadge status={item.status} />,
    },
    {
      header: 'Last Sync',
      accessor: (item: Template) => item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleDateString('id-ID') : '-',
    },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <LayoutTemplate className="w-6 h-6 text-sage" />
              Template Management
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Manage document templates across the system</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchTemplates}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-5 h-5 text-white/70" />
            </button>
            {!profileLoading && isAuthorized && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" />
                <span className="text-black">Sync New Template</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <DocumentTable
            data={templates}
            columns={columns}
            loading={loading}
            onRowClick={(item) => router.push(`/templates/${item._id}`)}
            emptyMessage="Belum ada template"
          />
        </div>
      </div>

      {/* Sync Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-sage" />
                Sync New Template
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-foreground/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {syncError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{syncError}</p>
              </div>
            )}

            <form onSubmit={handleSyncSubmit} className="space-y-4">
              <FormInput
                label="Kode Template*"
                name="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Misal: TPL-SURAT-TUGAS"
                required
              />

              <FormInput
                label="Nama Template*"
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Template Surat Tugas"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Tipe Dokumen*"
                  name="documentType"
                  value={form.documentType}
                  onChange={(val) => setForm({ ...form, documentType: val })}
                  options={[
                    { value: 'surat', label: 'Surat' },
                    { value: 'proposal', label: 'Proposal' },
                    { value: 'lpj', label: 'LPJ' },
                  ]}
                  required
                />

                <FormSelect
                  label="Kategori*"
                  name="category"
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  options={[
                    { value: 'internal', label: 'Internal' },
                    { value: 'external', label: 'External' },
                  ]}
                  required
                />
              </div>

              <FormInput
                label="Google Drive URL*"
                name="googleDriveUrl"
                value={form.googleDriveUrl}
                onChange={(e) => setForm({ ...form, googleDriveUrl: e.target.value })}
                placeholder="https://docs.google.com/document/d/..."
                required
              />

              <FormTextarea
                label="Deskripsi"
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Penjelasan singkat mengenai template ini..."
                rows={3}
              />

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={syncLoading}
                  className="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage/90 text-white text-sm font-medium transition-colors shadow-lg shadow-sage/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {syncLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync Template'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
