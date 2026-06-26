"use client";

import React, { useState, useEffect } from 'react';
import { templateApi } from '@/lib/api/templates';
import { RefreshCw } from 'lucide-react';

interface TemplatePreviewProps {
  templateId: string;
}

export function TemplatePreview({ templateId }: TemplatePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();
  }, [templateId]);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const dummyData = {
        title: "Dokumen Sample",
        letterNumber: "123/BEM-FT/2026",
        sender: "BEM FT UNESA",
        recipient: "Mahasiswa",
        content: "Ini adalah konten preview."
      };
      const payload = {
        templateData: dummyData,
      };
      const res = await templateApi.preview(templateId, payload);
      setHtmlContent(res.data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
      setHtmlContent('<div style="color: red; padding: 20px;">Failed to load preview. Please check console for details.</div>');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Live Preview</h3>
        <button
          onClick={fetchPreview}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-inner min-h-[600px] max-w-[800px] mx-auto overflow-hidden text-black border border-white/20 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/30 border-t-sage" />
          </div>
        )}
        <div 
          className="w-full h-full p-8"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
