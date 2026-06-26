'use client';

import { suratTemplates, SuratTemplate } from '@/lib/surat-templates';
import { FileText, ExternalLink } from 'lucide-react';

interface TemplatePickerProps {
  onSelect: (template: SuratTemplate) => void;
}

const categoryLabels: Record<string, string> = {
  surat: 'Surat',
  sk: 'Surat Keputusan (SK)',
  nota: 'Nota Dinas',
};

const categoryOrder = ['surat', 'sk', 'nota'];

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const grouped = categoryOrder.reduce<Record<string, SuratTemplate[]>>((acc, cat) => {
    acc[cat] = suratTemplates.filter(t => t.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4">
      {categoryOrder.map(cat => {
        const templates = grouped[cat];
        if (!templates || templates.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3 px-1">
              {categoryLabels[cat] || cat}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(template)}
                  className="text-left border border-white/10 rounded-xl p-4 bg-white/[0.03] hover:border-sage/50 hover:bg-sage/5 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sage/10 border border-sage/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sage/20 transition-colors">
                      <FileText className="w-4 h-4 text-sage" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white group-hover:text-sage transition-colors leading-tight">
                        {template.name}
                      </div>
                      <div className="text-xs text-foreground/45 mt-1 leading-relaxed">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
