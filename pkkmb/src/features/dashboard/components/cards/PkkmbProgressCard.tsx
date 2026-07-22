import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ProgressProps {
  progress: {
    percent: number;
    hasGroup: boolean;
    hasAttendedAny: boolean;
    hasSubmittedTask: boolean;
  };
}

export function PkkmbProgressCard({ progress }: ProgressProps) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Kesiapan PKKMB</h3>
      
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/70">Progres Administrasi & Tugas</span>
        <span className="text-sm font-bold text-primary">{progress.percent}%</span>
      </div>
      <div className="w-full bg-black/40 rounded-full h-3 mb-6 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-primary to-blue-500 h-3 rounded-full transition-all duration-1000" 
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${true ? 'bg-sage/10 border-sage/20 text-sage' : 'bg-white/5 border-white/5 text-foreground/40'}`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-semibold">Profil<br/>Lengkap</span>
        </div>
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${progress.hasGroup ? 'bg-sage/10 border-sage/20 text-sage' : 'bg-white/5 border-white/5 text-foreground/40'}`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-semibold">Masuk<br/>Kelompok</span>
        </div>
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${progress.hasAttendedAny ? 'bg-sage/10 border-sage/20 text-sage' : 'bg-white/5 border-white/5 text-foreground/40'}`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-semibold">Absensi<br/>Pertama</span>
        </div>
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${progress.hasSubmittedTask ? 'bg-sage/10 border-sage/20 text-sage' : 'bg-white/5 border-white/5 text-foreground/40'}`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-semibold">Tugas<br/>Pertama</span>
        </div>
      </div>
    </div>
  );
}
