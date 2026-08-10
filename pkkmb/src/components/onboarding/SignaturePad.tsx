"use client";

import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
}

export default function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const inBounds = (x: number, y: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    if (!inBounds(x, y)) return;
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    // Berhenti menggambar saat keluar area pad, jangan seret garis keluar.
    if (!inBounds(x, y)) {
      end();
      return;
    }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = (e?: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current!;
    if (e) canvas.releasePointerCapture(e.pointerId);
    drawingRef.current = false;
    const ctx = canvas.getContext("2d")!;
    // Deteksi apakah ada goresan (bukan kosong).
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasInk = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        hasInk = true;
        break;
      }
    }
    setHasSignature(hasInk);
    onChange(hasInk ? canvas.toDataURL("image/png") : null);
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="border border-white/15 rounded-2xl overflow-hidden bg-[#0a0a0a] touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-48 cursor-crosshair touch-none"
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 rounded-full text-sm font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
        >
          Ulangi Tanda Tangan
        </button>
      </div>
      <p className={`text-sm font-semibold ${hasSignature ? "text-green-400" : "text-yellow-400"}`}>
        {hasSignature ? "✓ Tanda tangan diberikan" : "Gambar tanda tangan Anda di atas (mouse/touch)"}
      </p>
    </div>
  );
}
