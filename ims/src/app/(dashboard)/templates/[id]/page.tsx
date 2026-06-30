"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { TemplateStatusBadge } from '@/components/document/TemplateStatusBadge';
import { TemplateInspector } from '@/components/document/TemplateInspector';
import { TemplatePreview } from '@/components/document/TemplatePreview';
import { Template, templateApi } from '@/lib/api/templates';
import ImsApiService from '@/lib/api';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui';
import { ArrowLeft, Edit3, Archive, X, AlertCircle } from 'lucide-react';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inspector' | 'preview' | 'history'>('overview');

  // Role authorization
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isDeprecateModalOpen, setIsDeprecateModalOpen] = useState(false);
  const [deprecateLoading, setDeprecateLoading] = useState(false);
  const [deprecateError, setDeprecateError] = useState<string | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'internal',
    googleDriveUrl: '',
    description: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchTemplate();
  }, [templateId]);

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

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await templateApi.getById(templateId);
      setTemplate(res.data);
      if (res.data) {
        setEditForm({
          name: res.data.name,
          category: res.data.category,
          googleDriveUrl: res.data.googleDriveUrl || '',
          description: res.data.description || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.googleDriveUrl) {
      setEditError('Harap isi semua kolom wajib (*)');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await templateApi.update(templateId, editForm);
      setIsEditModalOpen(false);
      fetchTemplate();
    } catch (err: any) {
      console.error('Failed to update template:', err);
      setEditError(err.message || 'Gagal mengubah data template.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeprecateSubmit = async () => {
    setDeprecateLoading(true);
    setDeprecateError(null);
    try {
      await templateApi.deprecate(templateId);
      setIsDeprecateModalOpen(false);
      fetchTemplate();
    } catch (err: any) {
      console.error('Failed to deprecate template:', err);
      setDeprecateError(err.message || 'Gagal mendepresiasi template ini.');
    } finally {
      setDeprecateLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 animate-spin rounded-full border-4 border-sage/30 border-t-sage" />
        </div>
      </DashboardShell>
    );
  }

  if (!template) {
    return (
      <DashboardShell>
        <div className="text-center p-20 text-foreground/60">
          Template dengan ID tersebut tidak ditemukan.
        </div>
      </DashboardShell>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'inspector', label: 'Inspector' },
    { id: 'preview', label: 'Preview' },
    { id: 'history', label: 'History' },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {template.name}
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Code: {template.code} | Type: {template.documentType}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            {!profileLoading && isAuthorized && (
              <>
                {template.status !== 'deprecated' && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Metadata</span>
                  </button>
                )}
                {template.status === 'published' && (
                  <button 
                    onClick={() => setIsDeprecateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Deprecate</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-4 border-b border-white/10 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'border-sage text-sage' 
                    : 'border-transparent text-foreground/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="glass-subtle p-6 rounded-xl border border-white/5">
                  <h3 className="text-lg font-medium text-white mb-4">Metadata</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <span className="block text-xs text-foreground/50 uppercase tracking-wider mb-1">Status</span>
                      <TemplateStatusBadge status={template.status} />
                    </div>
                    <div>
                      <span className="block text-xs text-foreground/50 uppercase tracking-wider mb-1">Version</span>
                      <span className="text-white font-medium">v{template.version}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-foreground/50 uppercase tracking-wider mb-1">Category</span>
                      <span className="text-white">{template.category}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-foreground/50 uppercase tracking-wider mb-1">Source Type</span>
                      <span className="text-white uppercase">{template.sourceType}</span>
                    </div>
                    {template.description && (
                      <div className="col-span-2">
                        <span className="block text-xs text-foreground/50 uppercase tracking-wider mb-1">Description</span>
                        <span className="text-white">{template.description}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="block text-xs text-foreground/50 uppercase tracking-wider mb-1">Google Drive URL</span>
                      {template.googleDriveUrl ? (
                        <a href={template.googleDriveUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">
                          {template.googleDriveUrl}
                        </a>
                      ) : (
                        <span className="text-foreground/50">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inspector' && (
              <div className="glass-subtle p-6 rounded-xl border border-white/5">
                <TemplateInspector templateId={template._id} onValidated={fetchTemplate} />
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="glass-subtle p-6 rounded-xl border border-white/5">
                <TemplatePreview templateId={template._id} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="glass-subtle p-6 rounded-xl border border-white/5 text-center text-foreground/50">
                Menampilkan versi sebelumnya untuk {template.code} (Fitur belum sepenuhnya diimplementasikan)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sage" />
                Edit Metadata
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-foreground/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{editError}</p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <FormInput
                label="Nama Template*"
                name="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Misal: Template Surat Tugas"
                required
              />

              <FormSelect
                label="Kategori*"
                name="category"
                value={editForm.category}
                onChange={(val) => setEditForm({ ...editForm, category: val })}
                options={[
                  { value: 'internal', label: 'Internal' },
                  { value: 'external', label: 'External' },
                ]}
                required
              />

              <FormInput
                label="Google Drive URL*"
                name="googleDriveUrl"
                value={editForm.googleDriveUrl}
                onChange={(e) => setEditForm({ ...editForm, googleDriveUrl: e.target.value })}
                placeholder="https://docs.google.com/document/d/..."
                required
              />

              <FormTextarea
                label="Deskripsi"
                name="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Penjelasan singkat..."
                rows={3}
              />

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage/90 text-white text-sm font-medium transition-colors shadow-lg shadow-sage/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deprecate Confirmation Modal */}
      {isDeprecateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-red-400" />
                Deprecate Template
              </h3>
              <button 
                onClick={() => setIsDeprecateModalOpen(false)}
                className="text-foreground/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deprecateError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{deprecateError}</p>
              </div>
            )}

            <div className="text-sm text-foreground/70 space-y-3">
              <p>Apakah Anda yakin ingin mendepresiasi template <strong>{template.name} ({template.code})</strong>?</p>
              <p className="bg-red-500/10 text-red-400 p-3 rounded-lg border border-red-500/20 text-xs">
                Tindakan ini tidak dapat dibatalkan. Template yang didepresiasi tidak akan dapat digunakan lagi untuk membuat surat baru.
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsDeprecateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeprecateSubmit}
                disabled={deprecateLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {deprecateLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Deprecating...
                  </>
                ) : (
                  'Deprecate Template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
