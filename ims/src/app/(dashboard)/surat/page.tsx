"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { SuratApi } from "@/lib/api/surat";
import { Surat } from "@/lib/types/surat";
import { DocumentState } from "@/lib/types/document";
import { FileText, Plus, Calendar, ArrowLeftRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DocumentTable } from "@/components/document/DocumentTable";
import { DocumentStatusBadge } from "@/components/document/DocumentStatusBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DocumentSearch } from "@/components/document/DocumentSearch";
import { Clock, CheckCircle, AlertCircle, Inbox } from "lucide-react";

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  incoming: { label: "Surat Masuk", color: "bg-accent-blue/15 text-accent-blue border-accent-blue/20" },
  outgoing: { label: "Surat Keluar", color: "bg-sage/15 text-sage border-sage/20" },
};

export default function SuratListPage() {
  const router = useRouter();
  const [suratList, setSuratList] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSurats = async () => {
      try {
        setLoading(true);
        // Note: Cabinet period might be automatically handled by the backend user context
        // but we can pass it if we have it. For now let's just get the list.
        const res = await SuratApi.getSuratList();
        if (res?.data) {
          setSuratList(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch surat list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurats();
  }, []);

  const tabs = [
    { label: "Semua", value: "" },
    { label: "Draft", value: DocumentState.DRAFT },
    { label: "Menunggu", value: DocumentState.SUBMITTED },
    { label: "Revisi", value: DocumentState.REVISION },
    { label: "Disetujui", value: DocumentState.APPROVED },
    { label: "Selesai", value: DocumentState.PUBLISHED },
  ];

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = suratList.length;
    let waiting = 0;
    let revision = 0;
    let completed = 0;
    
    suratList.forEach(s => {
      const state = s.workflowInstance?.currentState || DocumentState.DRAFT;
      if (state === DocumentState.SUBMITTED || state === DocumentState.REVIEWED) waiting++;
      else if (state === DocumentState.REVISION) revision++;
      else if (state === DocumentState.PUBLISHED || state === DocumentState.SIGNED || state === DocumentState.NUMBERED) completed++;
    });

    return { total, waiting, revision, completed };
  }, [suratList]);

  const filteredList = useMemo(() => suratList.filter((s) => {
    const currentState = s.workflowInstance?.currentState || DocumentState.DRAFT;
    const matchFilter = !activeFilter || currentState === activeFilter;
    const matchSearch =
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.letterNumber && s.letterNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  }), [suratList, activeFilter, searchQuery]);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-sage" />
              Persuratan & Dokumen
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola surat masuk, surat keluar, dan arsip dokumen resmi BEM FT</p>
          </div>
          <button
            onClick={() => router.push("/surat/new")}
            className="flex items-center justify-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Surat
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-start gap-4 hover:border-sage/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5 text-foreground/70" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-foreground/50 font-medium">Total Dokumen</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-start gap-4 hover:border-yellow-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.waiting}</div>
              <div className="text-sm text-foreground/50 font-medium">Menunggu Review</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-start gap-4 hover:border-orange-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.revision}</div>
              <div className="text-sm text-foreground/50 font-medium">Perlu Revisi</div>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-start gap-4 hover:border-emerald-500/20 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.completed}</div>
              <div className="text-sm text-foreground/50 font-medium">Selesai</div>
            </div>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveFilter(tab.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeFilter === tab.value 
                      ? 'bg-white/10 text-white' 
                      : 'text-foreground/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="w-full md:w-80 shrink-0">
              <DocumentSearch 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Cari dokumen..." 
              />
            </div>
          </div>
        </div>

        {/* Table / List View */}
        <DocumentTable<Surat>
          data={filteredList}
          columns={[
            {
              header: "Surat / Judul",
              accessor: (surat) => (
                <>
                  <div className="font-semibold text-white group-hover:text-sage transition-colors leading-snug truncate">
                    {surat.title}
                  </div>
                  <div className="text-xs text-foreground/45 mt-1 font-mono">
                    {surat.letterNumber || "Nomor belum di-assign"}
                  </div>
                </>
              ),
              className: "max-w-sm"
            },
            {
              header: "Jenis",
              accessor: (surat) => {
                const typeInfo = TYPE_MAP[surat.type] || { label: surat.type, color: "bg-white/10 text-white" };
                return (
                  <StatusBadge label={typeInfo.label} colorClass={typeInfo.color} />
                );
              }
            },
            {
              header: "Pengirim & Penerima",
              accessor: (surat) => (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{surat.sender}</span>
                    <ArrowLeftRight className="w-3 h-3 text-foreground/40" />
                    <span className="font-medium text-foreground/60">{surat.recipient}</span>
                  </div>
                  <div className="text-xs text-foreground/45 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(surat.createdAt)}
                  </div>
                </>
              )
            },
            {
              header: "Status",
              accessor: (surat) => {
                const state = surat.workflowInstance?.currentState || DocumentState.DRAFT;
                return <DocumentStatusBadge state={state} />;
              }
            },
            {
              header: "Detail",
              accessor: () => (
                <div className="text-xs text-sage group-hover:underline inline-flex items-center gap-1 font-semibold">
                  Lihat Detail
                </div>
              ),
              className: "text-right pr-6"
            }
          ]}
          loading={loading}
          onRowClick={(surat) => router.push(`/surat/${surat._id}`)}
          emptyMessage="Belum ada surat yang terdaftar sesuai kriteria"
        />
      </div>
    </DashboardShell>
  );
}
