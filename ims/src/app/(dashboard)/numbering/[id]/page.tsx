"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { TokenBuilder } from '@/components/document/TokenBuilder';
import { NumberingFormat, numberingApi } from '@/lib/api/numbering';
import {
  Hash, ArrowLeft, Save, Loader2,
  AlertTriangle, RotateCcw, History,
  Settings2, ShieldAlert
} from 'lucide-react';

const RESET_OPTIONS = [
  { value: 'never', label: 'Tidak Pernah' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'quarterly', label: 'Per Kuartal' },
  { value: 'semester', label: 'Per Semester' },
  { value: 'yearly', label: 'Tahunan' },
  { value: 'cabinet_period', label: 'Per Kabinet' },
];

type TabKey = 'format' | 'sequence' | 'audit';

export default function NumberingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [format, setFormat] = useState<NumberingFormat | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('format');

  // Editable fields
  const [formatPattern, setFormatPattern] = useState('');
  const [sequenceLength, setSequenceLength] = useState(3);
  const [resetPeriod, setResetPeriod] = useState('yearly');

  // Reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchFormat();
  }, [id]);

  const fetchFormat = async () => {
    try {
      setLoading(true);
      const res = await numberingApi.getFormat(id);
      const f = res.data;
      setFormat(f);
      setFormatPattern(f.formatPattern);
      setSequenceLength(f.sequenceLength);
      setResetPeriod(f.resetPeriod);
    } catch (error) {
      console.error('Failed to fetch format:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!format) return;
    try {
      setSaving(true);
      await numberingApi.updateFormat(id, {
        formatPattern,
        sequenceLength,
        resetPeriod: resetPeriod as NumberingFormat['resetPeriod'],
      });
      await fetchFormat();
    } catch (error) {
      console.error('Failed to save format:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!resetReason.trim()) return;
    try {
      setResetting(true);
      await numberingApi.resetSequence(id, {
        context: { documentType: format?.documentType || '', documentData: {} },
        reason: resetReason,
      });
      setShowResetModal(false);
      setResetReason('');
    } catch (error) {
      console.error('Failed to reset sequence:', error);
    } finally {
      setResetting(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'format', label: 'Format Builder', icon: <Settings2 className="w-4 h-4" /> },
    { key: 'sequence', label: 'Sequence Control', icon: <Hash className="w-4 h-4" /> },
    { key: 'audit', label: 'Audit Log', icon: <History className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-sage animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  if (!format) {
    return (
      <DashboardShell>
        <div className="text-center py-20 text-foreground/50">Format not found</div>
      </DashboardShell>
    );
  }

  const hasChanges =
    formatPattern !== format.formatPattern ||
    sequenceLength !== format.sequenceLength ||
    resetPeriod !== format.resetPeriod;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/numbering')}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
                {format.documentType.replace(/_/g, ' ')}
              </h1>
              <p className="text-foreground/50 text-sm mt-0.5">
                Version {format.version} · {format.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-sage text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save (creates v{format.version + 1})
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-foreground/50 hover:text-foreground/70 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'format' && (
          <div className="space-y-6">
            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground/70 mb-2 block">Sequence Length</label>
                <select
                  value={sequenceLength}
                  onChange={(e) => setSequenceLength(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage/50 appearance-none cursor-pointer"
                >
                  {[2, 3, 4, 5].map(n => (
                    <option key={n} value={n} className="bg-zinc-900">{n} digit (e.g. {'0'.repeat(n - 1)}1)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/70 mb-2 block">Reset Policy</label>
                <select
                  value={resetPeriod}
                  onChange={(e) => setResetPeriod(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sage/50 appearance-none cursor-pointer"
                >
                  {RESET_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Token Builder */}
            <TokenBuilder
              value={formatPattern}
              onChange={setFormatPattern}
              sequenceLength={sequenceLength}
              resetPeriod={resetPeriod}
              documentType={format.documentType}
            />
          </div>
        )}

        {activeTab === 'sequence' && (
          <div className="space-y-6">
            {/* Sequence Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-foreground/50 mb-1">Document Type</div>
                <div className="text-lg font-semibold text-white capitalize">{format.documentType.replace(/_/g, ' ')}</div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-foreground/50 mb-1">Reset Policy</div>
                <div className="text-lg font-semibold text-white">
                  {RESET_OPTIONS.find(o => o.value === format.resetPeriod)?.label}
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-foreground/50 mb-1">Version</div>
                <div className="text-lg font-semibold text-sage">v{format.version}</div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
              </div>
              <p className="text-sm text-foreground/60 mb-4">
                Reset sequence akan mengembalikan penomoran ke 0 untuk scope aktif saat ini.
                Tindakan ini tidak dapat dibatalkan dan akan dicatat di Audit Log.
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Sequence
              </button>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center">
            <History className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Audit Log</h3>
            <p className="text-sm text-foreground/50 max-w-md mx-auto">
              Riwayat perubahan format, reset sequence, dan penggunaan nomor akan ditampilkan di sini.
              Fitur ini akan terhubung dengan Sequence History setelah Phase 6.
            </p>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Konfirmasi Reset Sequence</h3>
            </div>
            <p className="text-sm text-foreground/60 mb-4">
              Tindakan ini akan mereset sequence untuk <strong className="text-white">{format.documentType}</strong> pada scope aktif saat ini.
              Masukkan alasan untuk melanjutkan.
            </p>
            <textarea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="Alasan reset (wajib diisi)..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowResetModal(false); setResetReason(''); }}
                className="px-4 py-2.5 text-sm text-foreground/70 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                disabled={!resetReason.trim() || resetting}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reset Sequence
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
