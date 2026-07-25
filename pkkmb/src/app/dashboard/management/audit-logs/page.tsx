"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Shield, User, Clock, Search, RefreshCw, Eye } from 'lucide-react';
import { apiClient } from '@/shared/api/axios';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface Actor {
  _id: string;
  name: string;
  email: string;
  nim?: string;
  role?: { name?: string; slug?: string } | string;
  division?: string;
}

interface AuditLogItem {
  _id: string;
  actor: Actor;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/pkkmb/admin/audit-logs?limit=100');
      setLogs(res.data?.data?.logs || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil audit log sistem.', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            AUDIT LOG AKTIVITAS SISTEM
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Catatan jejak audit aktivitas (Login, Create, Update, Delete, Publish) untuk keamanan & investigasi.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-[var(--text-secondary)]">
          Total Log Teratat: <span className="text-[var(--accent)] font-bold">{logs.length}</span>
        </div>
        <button
          type="button"
          onClick={fetchAuditLogs}
          className="px-3 py-2 bg-white/5 border border-[var(--border-default)] hover:border-[var(--accent)] text-[var(--accent)] font-mono text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Log List Table */}
      {isLoading ? (
        <LoadingState message="Memuat audit log aktivitas..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="BELUM ADA AUDIT LOG"
          description="Seluruh aktivitas penting sistem akan tercatat secara otomatis di sini."
        />
      ) : (
        <div className="surface-card overflow-hidden border border-[var(--border-subtle)] rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)] text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
                  <th className="py-3 px-4">WAKTU</th>
                  <th className="py-3 px-4">AKTOR (PENGGUNA)</th>
                  <th className="py-3 px-4">AKSI</th>
                  <th className="py-3 px-4">RESOURCE</th>
                  <th className="py-3 px-4 text-right">DETAIL DIFF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--text-primary)]">{log.actor?.name || 'Sistem'}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {log.actor?.email} • ROLE: {log.actorRole}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded uppercase">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold">{log.resourceType}</div>
                      {log.resourceName && (
                        <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
                          {log.resourceName}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-white/5 border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--accent)] text-[10px] rounded uppercase font-bold flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> Inspect State
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect State Detail Modal */}
      <Dialog
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`DETAIL AUDIT LOG [${selectedLog?.action || ''}]`}
        description="Pemeriksaan status data sebelum dan sesudah perubahan."
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-xs font-mono space-y-1">
              <div><strong>Aktor:</strong> {selectedLog.actor?.name} ({selectedLog.actor?.email})</div>
              <div><strong>Role / Divisi:</strong> {selectedLog.actorRole}</div>
              <div><strong>IP Address:</strong> {selectedLog.ipAddress || '127.0.0.1'}</div>
              <div><strong>User Agent:</strong> {selectedLog.userAgent || 'Chrome/Browser'}</div>
            </div>

            {selectedLog.before && (
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-[var(--semantic-danger)] uppercase tracking-wider">
                  State Sebelum Perubahan (Before):
                </label>
                <pre className="p-3 bg-black/50 border border-red-500/20 text-red-300 text-[10px] font-mono rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedLog.before, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.after && (
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold text-[var(--semantic-success)] uppercase tracking-wider">
                  State Sesudah Perubahan (After):
                </label>
                <pre className="p-3 bg-black/50 border border-green-500/20 text-green-300 text-[10px] font-mono rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedLog.after, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 btn-accent font-mono text-xs uppercase"
              >
                Tutup Inspection
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
