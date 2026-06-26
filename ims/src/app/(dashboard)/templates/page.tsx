"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { DocumentTable } from '@/components/document/DocumentTable';
import { TemplateStatusBadge } from '@/components/document/TemplateStatusBadge';
import { Template, templateApi } from '@/lib/api/templates';
import { Plus, RefreshCw, LayoutTemplate } from 'lucide-react';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

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
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-white/70" />
            </button>
            <button className="flex items-center justify-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer">
              <Plus className="w-4 h-4 text-black" />
              <span className="text-black">Sync New Template</span>
            </button>
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
    </DashboardShell>
  );
}
