"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { TemplateStatusBadge } from '@/components/document/TemplateStatusBadge';
import { TemplateInspector } from '@/components/document/TemplateInspector';
import { TemplatePreview } from '@/components/document/TemplatePreview';
import { Template, templateApi } from '@/lib/api/templates';
import { ArrowLeft, Edit3, Archive } from 'lucide-react';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inspector' | 'preview' | 'history'>('overview');

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await templateApi.getById(templateId);
      setTemplate(res.data);
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoading(false);
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
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            {template.status !== 'deprecated' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all">
                <Edit3 className="w-4 h-4" />
                <span>Edit Metadata</span>
              </button>
            )}
            {template.status === 'published' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20">
                <Archive className="w-4 h-4" />
                <span>Deprecate</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-4 border-b border-white/10 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
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
    </DashboardShell>
  );
}
