"use client";

export const dynamic = 'force-dynamic';

import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { ScrollText, Loader2, AlertCircle } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface AuditLogItem {
  _id: string;
  actor: {
    _id?: string;
    name?: string;
    email?: string;
    nim?: string;
    role?: string;
    division?: string;
  } | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_STYLES: Record<string, string> = {
  LOGIN: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  LOGOUT: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  CREATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  UPLOAD: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DOWNLOAD: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  UPDATE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  RENAME: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  MOVE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  RESTORE: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  PUBLISH: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  APPROVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECT: "bg-red-500/10 text-red-500 border-red-500/20",
  EXPORT: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  SHARE: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

function fmtDate(iso?: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function actorLabel(log: AuditLogItem): string {
  if (log.actor?.name) return log.actor.name;
  return log.actorRole || "System";
}

export default function PkkmbAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await ImsApiService.getAuditLogs<AuditLogItem>({
        page: targetPage,
        limit: 50,
      });
      if (res.success && res.data) {
        setLogs(res.data.logs);
        setPage(res.data.pagination.page || targetPage);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotal(res.data.pagination.total || 0);
      } else {
        setErrorMsg(res.message || "Gagal memuat audit log");
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setErrorMsg((err as Error).message || "Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(page), 0);
    return () => clearTimeout(t);
  }, [fetchLogs, page]);

  // filter aksi client-side pada halaman aktif
  const filteredLogs = actionFilter
    ? logs.filter((l) => l.action === actionFilter)
    : logs;
  const actionOptions = Array.from(new Set(logs.map((l) => l.action))).sort();

  return (
    <DashboardShell requirePkkmbAccess>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl flex items-center gap-2">
              <ScrollText className="w-8 h-8 text-emerald-500" />
              <span>Audit Log</span>
            </h1>
            <p className="text-sm text-ink-muted">
              Riwayat aktivitas pengguna dalam sistem PKKMB.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-semibold text-ink-muted">Filter Aksi:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg bg-surface-2 border border-hairline px-3 py-2 text-sm text-ink focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Semua Aksi</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm">Memuat audit log...</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surface-2 text-ink-muted font-bold">
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Aktor</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Aksi</th>
                    <th className="px-6 py-4">Sumber Daya</th>
                    <th className="px-6 py-4">Detail</th>
                    <th className="px-6 py-4">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-ink-muted">
                        Tidak ada audit log.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-ink-muted">{fmtDate(log.createdAt)}</td>
                        <td className="px-6 py-3 font-bold text-ink">
                          {actorLabel(log)}
                          {log.actor?.nim ? (
                            <span className="block font-mono text-xs font-normal text-ink-muted">{log.actor.nim}</span>
                          ) : null}
                        </td>
                        <td className="px-6 py-3 text-ink-muted">{log.actor?.role || log.actorRole || "-"}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${ACTION_STYLES[log.action] || "bg-ink-muted/10 text-ink-muted border-ink-muted/20"}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-ink-muted">{log.resourceType}{log.resourceName ? ` / ${log.resourceName}` : ""}</td>
                        <td className="px-6 py-3 max-w-[220px] truncate text-ink-muted">
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-ink-muted">{log.ipAddress || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-ink-muted">
              Total <span className="font-bold text-ink">{total}</span> log
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-surface-2 border border-hairline text-sm font-semibold text-ink hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-sm font-bold text-ink">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-surface-2 border border-hairline text-sm font-semibold text-ink hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
