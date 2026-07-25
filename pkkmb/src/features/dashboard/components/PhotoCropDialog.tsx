"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog } from '@/components/ui/dialog';
import { ZoomIn, RotateCw, Check, Loader2 } from 'lucide-react';
import { processAndCompressImage, PixelCrop } from '../utils/imageProcessor';

interface PhotoCropDialogProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (result: { file: File; blobUrl: string; sizeKb: number }) => void;
}

export function PhotoCropDialog({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: PhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteInternal = useCallback(
    (_croppedArea: unknown, croppedPixels: PixelCrop) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const result = await processAndCompressImage(
        imageSrc,
        croppedAreaPixels,
        rotation,
        1200,
        500 * 1024
      );
      onCropComplete(result);
      onClose();
    } catch (err) {
      console.error('Processing crop error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="CROP & EDIT PAS FOTO FORMAL"
      description="Atur posisi pas foto Anda (Rasio 3:4). Foto akan di-resize & dioptimasi otomatis ke WebP (< 500KB)."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Cropper Box */}
        <div className="relative w-full h-72 sm:h-80 bg-black rounded border border-[var(--border-default)] overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={3 / 4}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            style={{
              containerStyle: { background: '#040507' },
              cropAreaStyle: { border: '2px solid #D4AF37', borderRadius: '4px' },
            }}
          />
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-xs font-mono">
          {/* Zoom Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <ZoomIn className="h-3.5 w-3.5 text-[var(--accent)]" /> PERBESAR (ZOOM)
              </span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Rotate Button */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
              <RotateCw className="h-3.5 w-3.5 text-[var(--accent)]" /> ROTASI
            </span>
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="px-3 py-1.5 bg-white/5 border border-[var(--border-default)] hover:border-[var(--accent)] rounded text-[10px] uppercase font-bold text-[var(--text-primary)] transition-all"
            >
              Putar 90° ({rotation}°)
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-emphasis)] font-mono text-xs uppercase tracking-wider rounded transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-5 py-2 btn-accent font-mono text-xs uppercase tracking-wider flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mengompres & Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Simpan Pas Foto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
