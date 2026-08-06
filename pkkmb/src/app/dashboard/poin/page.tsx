"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { API_URL } from "@/lib/api";

interface PointLog {
  _id: string;
  points: number;
  source: string;
  reason?: string;
  createdAt: string;
}

export default function PoinPage() {
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/pkkmb/maba/points`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setTotalPoints(json.data.totalPoints);
            setLogs(json.data.logs || []);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const bySource = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.source] = (acc[log.source] || 0) + log.points;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Skor Keaktifan</h1>
        <p className="text-white/60">Pantau total skor dan riwayat perolehan poin PKKMB Anda.</p>
      </div>

      {/* Total Points Card */}
      <div className="bg-gradient-to-r from-gold-500/20 to-transparent border border-gold-500/30 rounded-3xl p-8 flex items-center gap-6">
        <div className="p-4 bg-gold-500/10 rounded-2xl text-gold-400">
          <Trophy className="w-10 h-10" />
        </div>
        <div>
          <p className="text-white/50 text-sm uppercase tracking-wider font-semibold mb-1">Total Skor</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-black text-gold-400">{totalPoints ?? 0}</span>
            <span className="text-gold-400/50 text-sm uppercase font-bold">PTS</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Source */}
      {Object.keys(bySource).length > 0 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold text-lg text-white mb-4">Rincian per Kategori</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([source, pts]) => (
              <div key={source} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <span className="text-white/70 text-sm font-medium">{source}</span>
                <span className={`font-bold ${pts >= 0 ? 'text-gold-400' : 'text-red-400'}`}>{pts > 0 ? '+' : ''}{pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-xl font-display font-bold mb-6">Riwayat Perolehan</h3>
        {logs.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
            <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/50">Belum Ada Riwayat</h3>
            <p className="text-white/40 text-sm mt-2">Poin akan bertambah seiring keaktifan Anda mengikuti kegiatan PKKMB.</p>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center gap-4 p-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${log.points >= 0 ? 'bg-gold-500/10 text-gold-400' : 'bg-red-500/10 text-red-400'}`}>
                  {log.points >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white truncate">{log.source}</span>
                    <span className={`font-bold text-sm shrink-0 ${log.points >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                      {log.points > 0 ? '+' : ''}{log.points}
                    </span>
                  </div>
                  {log.reason && <p className="text-xs text-white/50 truncate">{log.reason}</p>}
                  <p className="text-[10px] text-white/40 mt-1">
                    {new Date(log.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
