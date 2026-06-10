"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { committeesService } from "@/lib/api/committees";
import { usersService } from "@/lib/api/users";
import { prokerService } from "@/lib/api/proker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Briefcase,
  Award,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function MemberCommitteesPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { data: userResponse, isLoading: isUserLoading } = useQuery({
    queryKey: ["ims-user-workload", userId],
    queryFn: async () => {
      const res = await usersService.list();
      const found = res.data.find((u) => u._id === userId);
      if (!found) throw new Error("Anggota tidak ditemukan");
      return found;
    },
  });

  const { data: committeesResponse, isLoading: isCommitteesLoading } = useQuery(
    {
      queryKey: ["ims-user-committees-list", userId],
      queryFn: () => committeesService.getUserCommittees(userId),
      enabled: !!userId,
    },
  );

  const { data: prokerResponse } = useQuery({
    queryKey: ["ims-proker-lookup-committees"],
    queryFn: () => prokerService.list(),
  });

  const user = userResponse;
  const committees = committeesResponse?.data || [];
  const prokers = prokerResponse?.data || [];

  const getProkerTitle = (prokerId: string) => {
    return (
      prokers.find((p) => p._id === prokerId)?.title || "Program Kerja Terkait"
    );
  };

  if (isUserLoading || isCommitteesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Anggota Tidak Ditemukan</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const workloadCount = committees.length;

  const getWorkloadAlert = () => {
    if (workloadCount > 4) {
      return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Beban Kerja Sangat Tinggi!</p>
            <p className="text-xs text-red-300 mt-0.5">
              Fungsionaris ini terdaftar di {workloadCount} kepanitiaan aktif
              sekaligus. Berpotensi terjadi jadwal bentrok dan kelelahan.
            </p>
          </div>
        </div>
      );
    } else if (workloadCount > 2) {
      return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Beban Kerja Sedang</p>
            <p className="text-xs text-amber-300 mt-0.5">
              Fungsionaris terdaftar di {workloadCount} kepanitiaan. Monitor
              kinerjanya secara berkala.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm font-medium">
          <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Beban Kerja Optimal</p>
            <p className="text-xs text-emerald-300 mt-0.5">
              Fungsionaris ini memiliki alokasi tugas yang seimbang (
              {workloadCount} kepanitiaan).
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/kepanitiaan"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[#c8d2bd] hover:bg-white/10 hover:text-white transition-all w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Overview Beban Kerja
        </Link>

        {/* Profile Banner */}
        <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-linear-to-r from-white/8 via-transparent to-[#10b981]/10" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full border-2 border-[#10b981]/30 bg-[#10b981]/12 text-[#a7f3d0] flex items-center justify-center font-black text-2xl uppercase shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#a7f3d0] uppercase">
                  Fungsionaris Aktif
                </div>
                <h1 className="mt-2 text-2xl font-black text-white leading-tight md:text-3xl truncate">
                  {user.name}
                </h1>
                <p className="mt-1.5 text-xs font-semibold text-[#c8d2bd] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#10b981]" />{" "}
                  {user.position} • Departemen{" "}
                  <span className="text-[#a7f3d0]">{user.department}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end justify-center">
              <span className="text-[10px] uppercase font-bold text-[#a9b49c] tracking-wider">
                Email Fungsionaris
              </span>
              <span className="text-sm font-semibold text-white mt-1 select-all">
                {user.email}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Alert Warning */}
      {workloadCount > 4 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#ff7a7a]/10 border border-[#ff7a7a]/20 text-[#ff7a7a] text-sm font-medium shadow-[0_4px_20px_rgba(255,122,122,0.05)] backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-[#ff7a7a] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Beban Kerja Sangat Tinggi!</p>
            <p className="text-xs text-[#ff7a7a]/90 mt-0.5">
              Fungsionaris ini terdaftar di{" "}
              <strong className="text-white">
                {workloadCount} kepanitiaan aktif
              </strong>{" "}
              sekaligus. Berpotensi terjadi jadwal bentrok dan kelelahan kerja
              ekstrim.
            </p>
          </div>
        </div>
      ) : workloadCount > 2 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f0c36a]/10 border border-[#f0c36a]/20 text-[#f0c36a] text-sm font-medium shadow-[0_4px_20px_rgba(240,195,106,0.05)] backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-[#f0c36a] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Beban Kerja Sedang</p>
            <p className="text-xs text-[#f0c36a]/90 mt-0.5">
              Fungsionaris terdaftar di{" "}
              <strong className="text-white">
                {workloadCount} kepanitiaan aktif
              </strong>
              . Disarankan monitor kinerjanya secara berkala agar hasil tetap
              optimal.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#a7f3d0] text-sm font-medium shadow-[0_4px_20px_rgba(16,185,129,0.05)] backdrop-blur-md">
          <TrendingUp className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Beban Kerja Optimal</p>
            <p className="text-xs text-[#a7f3d0]/90 mt-0.5">
              Fungsionaris ini memiliki alokasi keterlibatan panitia yang
              seimbang (
              <strong className="text-white">
                {workloadCount} kepanitiaan
              </strong>
              ).
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Full committees list */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6 lg:col-span-2">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#10b981]" />
              Keanggotaan Kepanitiaan Aktif
            </h2>
            <p className="text-xs text-[#a9b49c] mt-1">
              Semua keterlibatan panitia resmi dalam program kerja kabinet.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {committees.length > 0 ? (
              <div className="divide-y divide-white/5">
                {committees.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#10b981]/25 bg-[#10b981]/10 text-[#a7f3d0] shrink-0 mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-sm">
                          {getProkerTitle(item.prokerId)}
                        </p>
                        <p className="text-xs text-[#a9b49c] mt-0.5">
                          Peran:{" "}
                          <strong className="text-white">{item.role}</strong>
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#10b981]/10 text-[#a7f3d0] border border-[#10b981]/20 font-bold text-[10px] uppercase shrink-0">
                      {item.department}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-[#a9b49c] italic flex flex-col items-center justify-center gap-3">
                <Briefcase className="h-8 w-8 text-white/20" />
                <p>Fungsionaris ini belum ditugaskan ke kepanitiaan apa pun.</p>
              </div>
            )}
          </div>
        </div>

        {/* Load Monitor Card */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6 h-fit">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
              Summary Performansi
            </h2>
          </div>

          <div className="mt-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#a9b49c]">Keterlibatan Kepanitiaan</span>
                <span className="font-bold text-white">
                  {workloadCount} Aktif
                </span>
              </div>
              <div className="h-2.5 bg-white/8 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    workloadCount > 4
                      ? "bg-[#ff7a7a]"
                      : workloadCount > 2
                        ? "bg-[#f0c36a]"
                        : "bg-[#10b981]"
                  }`}
                  style={{
                    width: `${Math.min((workloadCount / 6) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#a9b49c] leading-relaxed pt-4 border-t border-white/10">
              <p>
                • Rekomendasi beban kerja maksimal per semester adalah{" "}
                <strong className="text-white">3 kepanitiaan aktif</strong>.
              </p>
              <p>
                • Kadep berwenang membatasi partisipasi anggota departemennya
                jika terjadi penurunan performa akademis atau organisasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
