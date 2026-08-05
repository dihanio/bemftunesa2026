"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Profile {
  name?: string;
  pkkmbGroup?: { _id: string; nomor: number; name: string; pendampingId?: { name: string; phone: string } };
  role?: { slug?: string; name?: string } | string;
}

interface Stats {
  submitted?: number;
  total?: number;
  pendingTasks?: { deadline: string; title: string }[];
}

interface Schedule {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  isPriority?: boolean;
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [globalLinks, setGlobalLinks] = useState<{ pkkmb_buku_panduan_url: string, pkkmb_pusat_bantuan_url: string }>({ pkkmb_buku_panduan_url: '#', pkkmb_pusat_bantuan_url: '#' });
  const [adminStats, setAdminStats] = useState<{ totalMaba?: number, attendanceToday?: number, tasksSubmitted?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const [res, dashRes, statsRes, linksRes] = await Promise.all([
          fetch("http://localhost:4000/api/v1/auth/me", { credentials: "include" }),
          fetch("http://localhost:4000/api/v1/pkkmb/dashboard/maba", { credentials: "include" }),
          fetch("http://localhost:4000/api/v1/pkkmb/dashboard/maba/tasks", { credentials: "include" }),
          fetch("http://localhost:4000/api/v1/settings/public/links")
        ]);
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const roleObj = data.data.role;
            const roleString = typeof roleObj === 'object' && roleObj !== null
              ? (roleObj.slug || roleObj.name || 'user').toLowerCase()
              : String(roleObj || 'user').toLowerCase();
            setRole(roleString);
            setProfile(data.data);

            if (roleString !== 'user' && roleString !== 'maba') {
              try {
                const adminRes = await fetch("http://localhost:4000/api/v1/pkkmb/dashboard/admin", { credentials: "include" });
                if (adminRes.ok) {
                  const adminData = await adminRes.json();
                  if (adminData.success) {
                    setAdminStats(adminData.data);
                  }
                }
              } catch (e) {
                console.error("Failed to fetch admin stats:", e);
              }
            }
          }
        }

        if (dashRes.ok) {
           const dashData = await dashRes.json();
           if (dashData.success && dashData.data) {
             setSchedules(dashData.data.upcomingSchedules || []);
             setAnnouncements(dashData.data.announcements || []);
             if (dashData.data.user) {
               setProfile((prev) => ({
                 ...prev,
                 ...dashData.data.user
               }));
             }
           }
        }

        if (statsRes.ok) {
           const statsData = await statsRes.json();
           if (statsData.success) {
             setStats(statsData.data);
           }
        }

        if (linksRes.ok) {
           const linksData = await linksRes.json();
           if (linksData.success && linksData.data) {
             setGlobalLinks({
               pkkmb_buku_panduan_url: linksData.data.pkkmb_buku_panduan_url || '#',
               pkkmb_pusat_bantuan_url: linksData.data.pkkmb_pusat_bantuan_url || '#',
             });
           }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileAndStats();
  }, []);

  const getBantuanLink = () => {
    if (profile?.pkkmbGroup?.pendampingId?.phone) {
      let phone = profile.pkkmbGroup.pendampingId.phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.substring(1);
      return `https://wa.me/${phone}?text=Halo%20Kak%20${encodeURIComponent(profile.pkkmbGroup.pendampingId.name)}%2C%20saya%20${encodeURIComponent(profile.name || 'Maba')}%20dari%20Gugus%20${profile.pkkmbGroup.nomor}%20izin%20bertanya...`;
    }
    return globalLinks.pkkmb_pusat_bantuan_url;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  const isMaba = role === 'user' || role === 'maba'; // Ensure fallback default user role is considered as maba

  if (isMaba) {
    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Halo, <span className="text-gold-500">{profile?.name || 'Maba Adrata'}</span>! 👋</h2>
              <p className="text-white/60 font-body max-w-2xl text-lg">
                {profile?.pkkmbGroup?.name ? (
                  <span>Kamu tergabung dalam <strong className="text-white">Gugus {profile.pkkmbGroup.nomor}: {profile.pkkmbGroup.name}</strong>.</span>
                ) : (
                  <span>Status Gugus PKKMB: <strong className="text-gold-400">Sedang Diproses</strong>.</span>
                )}
              </p>
              <p className="text-white/40 mt-1 text-sm">
                Ini adalah pusat kendali utamamu selama PKKMB FT UNESA 2026.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area: Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timeline / Jadwal */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
               <h3 className="font-bold text-lg text-white mb-4">Jadwal PKKMB Hari Ini</h3>
               {schedules.length > 0 ? (
                 <div className="space-y-0">
                    {schedules.map((schedule, index) => {
                      const isLast = index === schedules.length - 1;
                      const isFirst = index === 0;
                      
                      const start = new Date(schedule.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      const end = new Date(schedule.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={schedule._id} className="flex gap-4">
                           <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full mt-1 ${isFirst ? 'bg-gold-500' : 'bg-white/20'}`}></div>
                              {!isLast && <div className="w-px h-full bg-white/10 my-1"></div>}
                           </div>
                           <div className={!isLast ? "pb-4" : ""}>
                              <p className="text-sm font-bold text-white">{start} - {end}</p>
                              <p className="text-sm text-white/60">{schedule.name}</p>
                           </div>
                        </div>
                      );
                    })}
                 </div>
               ) : (
                 <p className="text-sm text-white/40 italic">Belum ada jadwal yang diumumkan hari ini.</p>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PkkmbProgressCard */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                <h3 className="font-bold text-lg text-white mb-4">Progres Penugasan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Tugas Selesai</span>
                    <span className="font-bold text-gold-500">{stats?.submitted || 0} / {stats?.total || 0}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-gold-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats?.total ? Math.round(((stats?.submitted || 0) / stats.total) * 100) : 0}%` }}></div>
                  </div>
                  <p className="text-xs text-white/40">
                    {stats?.total ? Math.round(((stats?.submitted || 0) / stats.total) * 100) : 0}% dari total tugas PKKMB telah rampung.
                  </p>
                </div>
                <div className="mt-6">
                  <Link href="/dashboard/tugas" className="text-sm text-gold-500 hover:text-gold-400 font-semibold transition-colors">
                    Lihat Semua Tugas &rarr;
                  </Link>
                </div>
              </div>

              {/* NextActionCard */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                <h3 className="font-bold text-lg text-white mb-4">Aksi Mendesak</h3>
                
                {stats?.pendingTasks && stats.pendingTasks.length > 0 ? (
                  <>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Batas: {new Date(stats.pendingTasks[0].deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                      <p className="text-white font-medium text-sm truncate">{stats.pendingTasks[0].title}</p>
                    </div>
                    <div>
                      <Link href="/dashboard/tugas" className="inline-block w-full text-center bg-white/5 hover:bg-white/10 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                        Kerjakan Sekarang
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center pb-4 text-white/40 text-sm">
                    Tidak ada aksi mendesak atau tugas yang belum dikerjakan. Bagus!
                  </div>
                )}
              </div>
            </div>

            {/* Presensi GPS Widget Shortcut */}
            <div className="bg-gradient-to-r from-gold-500/10 to-transparent border border-gold-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
               <div>
                  <h3 className="font-bold text-lg text-white mb-1">Kehadiran (Live GPS)</h3>
                  <p className="text-white/60 text-sm">Absen mandiri saat sesi dibuka oleh Panitia di lokasi FT UNESA.</p>
               </div>
               <Link href="/dashboard/presensi" className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 px-6 rounded-xl whitespace-nowrap transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                  Buka Menu Presensi
               </Link>
            </div>
          </div>

          {/* Sidebar Area: Pengumuman, Quick Links */}
          <div className="space-y-6">
            
            {/* Pengumuman */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-lg text-white">Papan Pengumuman</h3>
                 {announcements.length > 0 && announcements[0].isPriority && (
                   <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-semibold border border-red-500/30">Penting</span>
                 )}
               </div>
               <div className="space-y-3">
                 {announcements.length > 0 ? (
                   announcements.map((ann, index) => (
                     <div key={ann._id || index} className="bg-white/5 rounded-xl p-4 border border-white/5">
                       <p className="text-sm text-white mb-2 font-medium">{ann.title}</p>
                       <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{ann.content}</p>
                       <p className="text-[10px] text-white/40 mt-3 font-medium">
                         {new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                       </p>
                     </div>
                   ))
                 ) : (
                   <p className="text-sm text-white/40 italic">Tidak ada pengumuman terbaru.</p>
                 )}
               </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
               <h3 className="font-bold text-lg text-white mb-4">Pintasan Cepat</h3>
               <div className="space-y-3">
                 <Link 
                   href={globalLinks.pkkmb_buku_panduan_url} 
                   target={globalLinks.pkkmb_buku_panduan_url !== '#' ? '_blank' : '_self'} 
                   className="block bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-colors"
                 >
                   <p className="text-sm font-medium text-white mb-1">Buku Panduan PKKMB</p>
                   <p className="text-xs text-white/50">Baca tata tertib dan daftar atribut.</p>
                 </Link>
                 <Link 
                   href={getBantuanLink()} 
                   target={getBantuanLink() !== '#' ? '_blank' : '_self'} 
                   className="block bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-colors"
                 >
                   <p className="text-sm font-medium text-white mb-1">Pusat Bantuan</p>
                   <p className="text-xs text-white/50">Hubungi pendamping gugusmu.</p>
                 </Link>
               </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Admin View
  const userDiv = ((profile as { division?: string } | null | undefined)?.division || '').toLowerCase();
  const isPendamping = userDiv.includes('pendamping');

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold mb-2">
            Selamat Datang di {role === 'super_admin' ? 'Admin Panel' : isPendamping ? 'Portal Pendamping' : 'Portal Panitia'}!
          </h2>
          <p className="text-white/60 font-body max-w-2xl">
            {isPendamping
              ? 'Pusat kendali Pendamping Gugus. Awasi kehadiran, periksa penugasan, dan kelola data mahasiswa baru di gugusmu.'
              : 'Pusat kendali Panitia dan Evaluator. Awasi kehadiran, periksa penugasan, dan kelola data mahasiswa baru di sini.'}
          </p>
        </div>
      </div>
      
      {/* Admin Quick Action Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(role === 'super_admin' || role === 'admin_pkkmb' || role === 'panitia' || userDiv.includes('pendamping') || userDiv.includes('sekretaris') || userDiv.includes('bph')) && (
          <Link href="/dashboard/manage/maba" className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-blue-500/20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">Total Mahasiswa</p>
                <h3 className="font-display text-4xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {adminStats?.totalMaba || 0}
                </h3>
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">{role === 'super_admin' || role === 'admin_pkkmb' ? 'Data Maba Global' : 'Data Maba Gugus'}</p>
                <p className="text-xs text-white/50">{role === 'super_admin' || role === 'admin_pkkmb' ? 'Kelola keseluruhan mahasiswa' : 'Mahasiswa di gugus Anda'}</p>
              </div>
            </div>
          </Link>
        )}
        
        {(role === 'super_admin' || role === 'admin_pkkmb' || role === 'panitia' || userDiv.includes('pendamping') || userDiv.includes('sekretaris') || userDiv.includes('bph')) && (
          <Link href="/dashboard/manage/attendance" className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-green-500/20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">Kehadiran Hari Ini</p>
                <h3 className="font-display text-4xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors">
                  {adminStats?.attendanceToday || 0}
                </h3>
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">{role === 'super_admin' || role === 'admin_pkkmb' ? 'Live Presensi' : 'Presensi Gugus'}</p>
                <p className="text-xs text-white/50">Pantau absensi GPS real-time</p>
              </div>
            </div>
          </Link>
        )}

        {(role === 'super_admin' || role === 'admin_pkkmb' || role === 'panitia' || userDiv.includes('pendamping') || userDiv.includes('pemateri')) && (
          <Link href="/dashboard/manage/evaluator" className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-purple-500/20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">Tugas Terkumpul</p>
                <h3 className="font-display text-4xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                  {adminStats?.tasksSubmitted || 0}
                </h3>
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">{role === 'super_admin' || role === 'admin_pkkmb' ? 'Evaluator Tugas' : 'Tugas Gugus'}</p>
                <p className="text-xs text-white/50">Antrean koreksi penugasan</p>
              </div>
            </div>
          </Link>
        )}

        {(role === 'super_admin' || role === 'admin_pkkmb' || userDiv.includes('tatib') || userDiv.includes('tata tertib') || userDiv.includes('komdis')) && (
          <Link href="/dashboard/manage/komdis" className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-end hover:bg-white/[0.06] transition-all group overflow-hidden min-h-[160px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-red-500/20"></div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                Tata Tertib
              </h3>
              <p className="text-xs text-white/50">Catat insiden ketertiban evaluasi</p>
            </div>
            <div className="absolute top-6 right-6 text-white/20 group-hover:text-red-400 group-hover:translate-x-1 transition-all">
              &rarr;
            </div>
          </Link>
        )}

        {(role === 'super_admin') && (
          <Link href="/dashboard/manage/groups" className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-end hover:bg-white/[0.06] transition-all group overflow-hidden min-h-[160px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-cyan-500/20"></div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                Manajemen Gugus
              </h3>
              <p className="text-xs text-white/50">Kelola kelompok PKKMB dan pendamping</p>
            </div>
            <div className="absolute top-6 right-6 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
              &rarr;
            </div>
          </Link>
        )}
        
        {/* Shortcut Simulator Presensi untuk Admin */}
        {(role === 'super_admin' || role === 'admin_pkkmb') && (
          <Link href="/dashboard/presensi" className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-end hover:bg-white/[0.06] transition-all group overflow-hidden min-h-[160px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-gold-500/20"></div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-gold-400 transition-colors">
                Tes Presensi
              </h3>
              <p className="text-xs text-white/50">Buka mode mahasiswa untuk uji coba presensi GPS</p>
            </div>
            <div className="absolute top-6 right-6 text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all">
              &rarr;
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
