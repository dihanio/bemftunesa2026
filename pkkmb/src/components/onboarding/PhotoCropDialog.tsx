"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut, Upload, Loader2 } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface PhotoCropDialogProps {
  onImageCropped: (croppedBlob: Blob, dataUrl: string) => void;
  isLoading?: boolean;
}

// Utility to create image from url
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// Utility to crop image and return a canvas blob (webp)
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<{ blob: Blob; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set the standard 3:4 aspect ratio resolution for passport photos
  // Max resolution to ensure it stays under ~500kb WebP
  canvas.width = 600;
  canvas.height = 800;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      "image/webp",
      0.85 // 85% quality for good compression vs quality
    );
  });
}

export default function PhotoCropDialog({ onImageCropped, isLoading }: PhotoCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImageSrc(reader.result?.toString() || null)
      );
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const { blob, url } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onImageCropped(blob, url);
    } catch (e) {
      console.error(e);
      alert("Gagal memproses gambar");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      {!imageSrc ? (
        <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:bg-white/[0.05] transition-colors relative cursor-pointer group">
          <input 
            type="file" 
            accept="image/*" 
            onChange={onFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-gold-500" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-white">Pilih Foto 3x4</h3>
          <p className="text-white/50 text-sm max-w-sm mx-auto">
            Klik atau seret file gambar ke area ini. Format yang didukung: JPG, PNG, WEBP (Maks 5MB).
          </p>
        </div>
      ) : mounted ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-[#1a1a1a] rounded-3xl p-4 md:p-6 space-y-4 shadow-2xl border border-white/10 my-auto">
            <h3 className="text-xl font-bold text-white text-center">Sesuaikan Foto</h3>
            
            <div className="relative h-[45vh] md:h-[400px] w-full bg-black rounded-2xl overflow-hidden border border-white/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="vertical-cover"
              />
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
              <ZoomOut className="w-5 h-5 text-white/50 shrink-0" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
              <ZoomIn className="w-5 h-5 text-white/50 shrink-0" />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setImageSrc(null)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-black bg-gold-500 hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {isProcessing || isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {isProcessing ? "Memproses..." : isLoading ? "Mengunggah..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
