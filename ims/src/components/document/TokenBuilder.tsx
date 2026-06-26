"use client";

import React, { useEffect, useState, useRef } from 'react';
import { NumberingToken, NumberingPreview, numberingApi } from '@/lib/api/numbering';
import { Hash, Calendar, Building2, FileText, Eye, Loader2 } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  system: <Hash className="w-3.5 h-3.5" />,
  date: <Calendar className="w-3.5 h-3.5" />,
  metadata: <FileText className="w-3.5 h-3.5" />,
  organization: <Building2 className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  system: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  date: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  metadata: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  organization: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

interface TokenBuilderProps {
  value: string;
  onChange: (value: string) => void;
  sequenceLength: number;
  resetPeriod: string;
  documentType?: string;
}

export function TokenBuilder({ value, onChange, sequenceLength, resetPeriod, documentType }: TokenBuilderProps) {
  const [tokens, setTokens] = useState<NumberingToken[]>([]);
  const [preview, setPreview] = useState<NumberingPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    numberingApi.getTokens().then(res => setTokens(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPreview();
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, sequenceLength, resetPeriod]);

  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await numberingApi.preview({
        formatPattern: value,
        resetPeriod,
        sequenceLength,
        context: {
          documentType: documentType || 'preview',
          documentData: {},
          metadata: {
            documentCode: 'SPm',
            departmentCode: 'PSDM',
            cabinetCode: 'RENGGANIS',
            cabinetPeriodName: '2026-2027',
          },
        },
      });
      setPreview(res.data);
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const insertToken = (tokenId: string) => {
    const tokenStr = `{{${tokenId}}}`;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const newValue = value.slice(0, start) + tokenStr + value.slice(end);
      onChange(newValue);
      // Re-focus and position cursor after the inserted token
      setTimeout(() => {
        input.focus();
        const newPos = start + tokenStr.length;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      onChange(value + tokenStr);
    }
  };

  // Group tokens by category
  const grouped = tokens.reduce<Record<string, NumberingToken[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Token Palette */}
      <div>
        <label className="text-sm font-medium text-foreground/70 mb-3 block">Available Tokens</label>
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, categoryTokens]) => (
            <div key={category}>
              <div className="text-xs uppercase tracking-wider text-foreground/40 mb-1.5 flex items-center gap-1.5">
                {CATEGORY_ICONS[category]}
                {category}
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryTokens.map(token => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => insertToken(token.id)}
                    title={token.description}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${CATEGORY_COLORS[category]}`}
                  >
                    {`{{${token.id}}}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Format Input */}
      <div>
        <label className="text-sm font-medium text-foreground/70 mb-2 block">Format Pattern</label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. {{SEQUENCE}}/SPm/{{DEPARTMENT}}/BEM-FT/UNESA/{{ROMAN_MONTH}}/{{YEAR}}"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage/50 transition-all"
        />
        <p className="text-xs text-foreground/40 mt-1">Click tokens above to insert, or type delimiters like / manually.</p>
      </div>

      {/* Live Preview */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-sage" />
          <span className="text-sm font-semibold text-white">Live Preview</span>
          {loadingPreview && <Loader2 className="w-3.5 h-3.5 text-sage animate-spin" />}
        </div>

        {preview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-foreground/50 mb-1">Current</div>
                <div className="text-sm font-mono text-white font-medium">{preview.current}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-foreground/50 mb-1">Next</div>
                <div className="text-sm font-mono text-sage font-medium">{preview.next}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="text-xs text-foreground/50 mb-1">Next Reset Period</div>
                <div className="text-sm font-mono text-amber-400 font-medium">{preview.nextReset}</div>
              </div>
            </div>

            {/* Resolved Tokens Breakdown */}
            <div>
              <div className="text-xs text-foreground/50 mb-2">Resolved Tokens</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(preview.resolvedTokens).map(([key, val]) => (
                  <div key={key} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs">
                    <span className="text-foreground/50 font-mono">{key}</span>
                    <span className="text-foreground/30">=</span>
                    <span className="text-white font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/40">
            {value ? 'Generating preview...' : 'Insert tokens to see a live preview.'}
          </p>
        )}
      </div>
    </div>
  );
}
