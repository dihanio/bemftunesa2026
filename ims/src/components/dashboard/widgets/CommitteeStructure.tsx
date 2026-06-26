import React, { useEffect, useState } from 'react';
import { Users, Shield, User, AlertCircle } from 'lucide-react';

export function CommitteeStructure() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API Call goes here
    setMembers([]);
    setLoading(false);
  }, []);

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-blue" />
          Struktur Inti Kepanitiaan
        </h3>
        <span className="text-xs text-foreground/50 bg-background/50 px-2 py-1 rounded">56 Total</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-6 text-foreground/40 text-sm animate-pulse">Memuat struktur...</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-foreground/40 text-sm gap-2">
            <Users className="w-8 h-8 text-sage/30" />
            <p>Struktur kepanitiaan belum diisi.</p>
          </div>
        ) : (
          members.map((member, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sage/10 text-sage flex items-center justify-center text-xs font-bold border border-sage/20 shrink-0">
                  {member.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{member.name}</span>
                  <span className="text-xs text-foreground/40">{member.role}</span>
                </div>
              </div>
              
              <div className={`p-1.5 rounded-lg border ${
                member.division === 'Inti' ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' : 
                'bg-white/5 text-foreground/50 border-white/5'
              }`}>
                {member.division === 'Inti' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
            </div>
          ))
        )}
      </div>
      
      {members.length > 0 && (
        <button className="mt-auto pt-4 text-xs text-center w-full text-sage hover:text-sage/80 transition-colors font-medium border-t border-white/5">
          Lihat Semua Anggota
        </button>
      )}
    </div>
  );
}
