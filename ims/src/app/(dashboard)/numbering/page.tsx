"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { DocumentTable } from '@/components/document/DocumentTable';
import { NumberingFormat, numberingApi } from '@/lib/api/numbering';
import { RefreshCw, Hash } from 'lucide-react';

const RESET_LABELS: Record<string, string> = {
  never: 'Tidak Pernah',
  monthly: 'Bulanan',
  quarterly: 'Per Kuartal',
  semester: 'Per Semester',
  yearly: 'Tahunan',
  cabinet_period: 'Per Kabinet',
};

export default function NumberingPage() {
  const router = useRouter();
  const [formats, setFormats] = useState<NumberingFormat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormats();
  }, []);

  const fetchFormats = async () => {
    try {
      setLoading(true);
      const res = await numberingApi.getFormats();
      setFormats(res.data);
    } catch (error) {
      console.error('Failed to fetch numbering formats:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Document Type',
      accessor: (item: NumberingFormat) => (
        <div>
          <div className="font-medium text-white capitalize">{item.documentType.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      header: 'Format Pattern',
      accessor: (item: NumberingFormat) => (
        <code className="text-xs bg-white/5 text-sage px-2 py-1 rounded font-mono">
          {item.formatPattern}
        </code>
      ),
    },
    {
      header: 'Seq. Length',
      accessor: (item: NumberingFormat) => (
        <span className="text-foreground/70">{item.sequenceLength} digit</span>
      ),
    },
    {
      header: 'Reset Policy',
      accessor: (item: NumberingFormat) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-foreground/80 border border-white/10">
          {RESET_LABELS[item.resetPeriod] || item.resetPeriod}
        </span>
      ),
    },
    {
      header: 'Version',
      accessor: (item: NumberingFormat) => (
        <span className="text-sage font-medium">v{item.version}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (item: NumberingFormat) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          item.isActive
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <Hash className="w-6 h-6 text-sage" />
              Numbering Management
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola format penomoran untuk seluruh dokumen</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchFormats}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <DocumentTable
            data={formats}
            columns={columns}
            loading={loading}
            onRowClick={(item) => router.push(`/numbering/${item._id}`)}
            emptyMessage="Belum ada format penomoran"
          />
        </div>
      </div>
    </DashboardShell>
  );
}
