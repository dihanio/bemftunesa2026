'use client';

import React, { useEffect, useState } from 'react';
import ImsApiService from '@/lib/api';
import { DocumentTemplate } from '@/lib/api/template';
import { FileText, AlertCircle, RefreshCw, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface TemplatePickerProps {
  selectedId: string | null;
  onSelect: (template: DocumentTemplate | null) => void;
}

const categoryLabels: Record<string, string> = {
  surat: 'Surat',
  sk: 'Surat Keputusan (SK)',
  nota: 'Nota Dinas',
  internal: 'Internal',
  external: 'Eksternal',
};

function TemplateCard({ 
  template, 
  isSelected, 
  onSelect 
}: { 
  template: DocumentTemplate; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLongDescription = template.description && template.description.length > 80;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left border rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col h-full ${
        isSelected 
          ? 'bg-sage/10 border-sage/50 shadow-md shadow-sage/10 ring-1 ring-sage/50' 
          : 'bg-white/[0.03] border-white/10 hover:border-sage/30 hover:bg-sage/5'
      }`}
    >
      <div className="flex items-start gap-3 w-full">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          isSelected ? 'bg-sage text-white' : 'bg-sage/10 text-sage border border-sage/20 group-hover:bg-sage/20'
        }`}>
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start gap-2">
            <div className={`font-semibold text-sm leading-tight transition-colors ${
              isSelected ? 'text-sage' : 'text-white group-hover:text-sage-light'
            }`}>
              {template.name}
            </div>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />}
          </div>
          
          <div className="flex items-center gap-2 mt-1.5 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-foreground/60 border border-white/10">
              {categoryLabels[template.documentType] || template.documentType || 'UMUM'}
            </span>
          </div>

          <div className="text-xs text-foreground/55 leading-relaxed relative">
            <div className={`${expanded ? '' : 'line-clamp-2'}`}>
              {template.description || 'Tidak ada deskripsi'}
            </div>
            
            {isLongDescription && (
              <div 
                className="text-sage text-[10px] font-semibold flex items-center mt-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3 mr-0.5" /> Lebih sedikit</>
                ) : (
                  <><ChevronDown className="w-3 h-3 mr-0.5" /> Baca selengkapnya</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-auto pt-4 w-full">
         <div className={`text-xs font-semibold py-1.5 px-3 rounded-lg text-center transition-colors ${
           isSelected ? 'bg-sage text-white' : 'bg-white/5 text-foreground/70 group-hover:bg-white/10 group-hover:text-white'
         }`}>
           {isSelected ? 'Terpilih' : 'Gunakan Template'}
         </div>
      </div>
    </button>
  );
}

export default function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ImsApiService.getTemplates();
      if (res.data) {
        setTemplates(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setError(err.message || 'Gagal memuat daftar template dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-sage/20 border-t-sage" />
        <p className="text-xs text-foreground/50">Memuat daftar template...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <p className="text-sm text-rose-300">{error}</p>
        <button
          onClick={fetchTemplates}
          className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
        </button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="border border-white/5 p-8 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
        <FileText className="w-8 h-8 text-foreground/30" />
        <p className="text-sm text-foreground/60">Belum ada template aktif yang tersedia.</p>
      </div>
    );
  }

  // Group by documentType
  const grouped = templates.reduce<Record<string, DocumentTemplate[]>>((acc, tpl) => {
    const cat = tpl.documentType || 'lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tpl);
    return acc;
  }, {});

  const order = ['surat', 'sk', 'nota'];
  const categories = Object.keys(grouped).sort((a, b) => {
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Opsi tanpa template */}
      <div className="flex justify-end px-4">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`text-xs font-semibold px-4 py-2 border rounded-xl transition-all flex items-center gap-2 ${
            selectedId === 'blank'
              ? 'bg-sage/10 text-sage border-sage/40'
              : 'bg-white/5 text-foreground/60 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
           {selectedId === 'blank' && <CheckCircle2 className="w-3.5 h-3.5" />}
           Buat Tanpa Template (Kosong)
        </button>
      </div>

      {categories.map(cat => {
        const catTemplates = grouped[cat];
        return (
          <div key={cat} className="px-4">
            <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3 px-1 border-b border-white/5 pb-2">
              {categoryLabels[cat] || cat}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {catTemplates.map((template) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  isSelected={selectedId === template._id}
                  onSelect={() => onSelect(template)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
