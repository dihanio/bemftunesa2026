import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, FileText, DollarSign, AlertCircle } from 'lucide-react';
import ImsApiService, { SuratItem, KeuanganItem } from '../../../lib/api';

interface ApprovalQueueProps {
  type?: 'all' | 'surat' | 'keuangan';
  priorityOnly?: boolean;
}

export function ApprovalQueue({ type = 'all', priorityOnly = false }: ApprovalQueueProps) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both surat and keuangan concurrently
        const [suratRes, keuanganRes] = await Promise.all([
          ImsApiService.getSuratList(),
          ImsApiService.getKeuanganList()
        ]);

        const pendingSurat = (suratRes.data || [])
          .filter((s: any) => s.status === 'pending_approval')
          .map((s: any) => ({
            id: s._id,
            type: 'surat',
            title: s.title,
            requester: s.submittedBy?.name || 'Unknown',
            date: new Date(s.createdAt).toISOString().split('T')[0],
            priority: 'medium', // Logic for priority
            status: s.status
          }));

        const pendingKeuangan = (keuanganRes.data || [])
          .filter((k: KeuanganItem) => k.status.includes('pending'))
          .map((k: KeuanganItem) => ({
            id: k._id,
            type: 'keuangan',
            title: `RAB - ${(k.prokerId as any)?.title || 'Umum'}`,
            requester: k.createdBy?.name || 'Unknown',
            date: new Date(k.createdAt).toISOString().split('T')[0],
            priority: 'high',
            status: k.status
          }));

        setApprovals([...pendingSurat, ...pendingKeuangan].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  let filteredApprovals = approvals;
  if (type !== 'all') {
    filteredApprovals = filteredApprovals.filter(a => a.type === type);
  }
  if (priorityOnly) {
    filteredApprovals = filteredApprovals.filter(a => a.priority === 'high');
  }

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent-gold" />
          Antrean Persetujuan {priorityOnly && '(Prioritas)'}
        </h3>
        <span className="text-xs bg-accent-gold/10 text-accent-gold px-2 py-0.5 rounded-full font-medium">
          {filteredApprovals.length} Pending
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-2">
        {loading ? (
          <div className="text-center py-8 text-foreground/40 text-sm animate-pulse">
            Memuat data...
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-foreground/40 text-sm">
            <CheckCircle className="w-8 h-8 text-sage/30 mb-2" />
            <p>Tidak ada persetujuan yang menunggu.</p>
          </div>
        ) : (
          filteredApprovals.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-white/5 hover:border-sage/20 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.type === 'surat' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-sage/10 text-sage'
                }`}>
                  {item.type === 'surat' ? <FileText className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground group-hover:text-sage transition-colors line-clamp-1">{item.title}</span>
                  <div className="flex items-center gap-2 text-xs text-foreground/40">
                    <span>{item.requester}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sage/10 text-sage hover:bg-sage/20 transition-colors">
                  Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
