"use client";

import React, { useState, useEffect } from 'react';
import { templateApi } from '@/lib/api/templates';
import { CheckCircle, AlertTriangle, Info, XCircle, RefreshCw, Send } from 'lucide-react';

interface InspectorResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
  extractedPlaceholders: string[];
}

interface TemplateInspectorProps {
  templateId: string;
  onValidated?: () => void;
}

export function TemplateInspector({ templateId, onValidated }: TemplateInspectorProps) {
  const [result, setResult] = useState<InspectorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const res = await templateApi.validate(templateId);
      setResult(res.data);
      if (res.data.isValid && onValidated) {
        onValidated();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const publishTemplate = async () => {
    setPublishing(true);
    try {
      await templateApi.publish(templateId);
      // Reload or trigger callback
      if (onValidated) onValidated();
    } catch (error) {
      console.error(error);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Template Inspector</h3>
          <p className="text-sm text-foreground/60">Validasi placeholders dan struktur template.</p>
        </div>
        <button
          onClick={runValidation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Validation</span>
        </button>
      </div>

      {!result && !loading && (
        <div className="p-12 text-center border border-white/10 border-dashed rounded-xl glass-subtle text-foreground/50">
          Klik "Run Validation" untuk memulai inspeksi template.
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${result.isValid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} flex items-center gap-3`}>
            {result.isValid ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <div>
              <h4 className="font-semibold">{result.isValid ? 'Validation Passed' : 'Validation Failed'}</h4>
              <p className="text-sm opacity-80">{result.isValid ? 'Template is ready to be published.' : 'Please fix the errors below before publishing.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                Errors ({result.errors.length})
              </h4>
              {result.errors.length > 0 ? (
                <ul className="space-y-2">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-sm text-red-400/90 bg-red-500/5 p-3 rounded-lg border border-red-500/10">{e}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/50 italic">No errors found.</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Warnings ({result.warnings.length})
              </h4>
              {result.warnings.length > 0 ? (
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-yellow-400/90 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">{w}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/50 italic">No warnings found.</p>
              )}
            </div>

            <div className="space-y-3 md:col-span-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                Infos ({result.infos.length})
              </h4>
              {result.infos.length > 0 ? (
                <ul className="space-y-2">
                  {result.infos.map((info, i) => (
                    <li key={i} className="text-sm text-blue-400/90 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">{info}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/50 italic">No info messages.</p>
              )}
            </div>
          </div>
          
          {result.isValid && (
            <div className="pt-6 flex justify-end">
              <button
                onClick={publishTemplate}
                disabled={publishing}
                className="flex items-center gap-2 px-6 py-3 bg-sage text-black font-semibold rounded-lg hover:bg-sage/90 disabled:opacity-50 transition-all"
              >
                {publishing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                <span>Publish Template</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
