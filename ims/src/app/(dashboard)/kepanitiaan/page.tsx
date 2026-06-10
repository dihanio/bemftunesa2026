"use client";

import { useQuery } from "@tanstack/react-query";
import { committeesService } from "@/lib/api/committees";
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
  Users,
  Search,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function KepanitiaanPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: overviewResponse, isLoading } = useQuery({
    queryKey: ["ims-committees-overview"],
    queryFn: () => committeesService.getOverview(),
  });

  const overviewList = overviewResponse?.data || [];

  const getWorkloadBadge = (count: number) => {
    if (count > 4) {
      return (
        <Badge className="bg-[#ff7a7a]/15 text-[#ff7a7a] border-[#ff7a7a]/30 font-bold text-xs gap-1">
          <ShieldAlert className="w-3 h-3" />
          Overload ({count})
        </Badge>
      );
    } else if (count > 2) {
      return (
        <Badge className="bg-[#f0c36a]/15 text-[#f0c36a] border-[#f0c36a]/30 font-bold text-xs gap-1">
          <AlertTriangle className="w-3 h-3" />
          Warning ({count})
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-[#10b981]/15 text-[#a7f3d0] border-[#10b981]/30 font-bold text-xs">
          Optimal ({count})
        </Badge>
      );
    }
  };

  const filteredOverview = overviewList.filter((item) =>
    item.userName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-linear-to-r from-white/8 via-transparent to-[#10b981]/10" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-3 py-1 text-[11px] font-semibold text-[#a7f3d0]">
            <Users className="h-3.5 w-3.5 animate-pulse" />
            Human Resources Operations
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl">
            Beban Kerja Kepanitiaan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c8d2bd]">
            Pemantauan kapasitas, keterlibatan aktif, dan indeks beban kerja
            fungsionaris aktif BEM FT UNESA dalam program kerja kabinet.
          </p>
        </div>
      </section>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6">
        <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10b981]" />
              Workload Monitoring
            </h2>
            <p className="text-xs text-[#a9b49c] mt-1">
              Klik pada anggota untuk melihat rincian riwayat dan jadwal
              kepanitiaan.
            </p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a9b49c]" />
            <Input
              placeholder="Cari fungsionaris..."
              className="pl-10 bg-white/8 border-white/10 rounded-lg text-white placeholder-[#a9b49c] focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 overflow-hidden bg-[#091c11]/40">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow>
                <TableHead className="w-[300px] text-[#a7f3d0] font-bold text-xs uppercase tracking-wider py-4 pl-4">
                  Fungsionaris
                </TableHead>
                <TableHead className="text-[#a7f3d0] font-bold text-xs uppercase tracking-wider py-4">
                  Departemen
                </TableHead>
                <TableHead className="text-[#a7f3d0] font-bold text-xs uppercase tracking-wider py-4">
                  Beban Kerja (Kepanitiaan)
                </TableHead>
                <TableHead className="text-[#a7f3d0] font-bold text-xs uppercase tracking-wider py-4 text-right pr-4">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="border-b border-white/5 last:border-0"
                  >
                    <TableCell className="py-4 pl-4">
                      <div className="h-4 w-48 bg-white/10 animate-pulse rounded" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="h-6 w-20 bg-white/10 animate-pulse rounded-full" />
                    </TableCell>
                    <TableCell className="py-4 text-right pr-4">
                      <div className="h-4 w-8 bg-white/10 animate-pulse rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOverview.length > 0 ? (
                filteredOverview.map((item) => {
                  return (
                    <TableRow
                      key={item.userId}
                      className="hover:bg-white/8 transition-colors border-b border-white/5 last:border-0 cursor-pointer"
                      onClick={() => router.push(`/kepanitiaan/${item.userId}`)}
                    >
                      <TableCell className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full border border-[#10b981]/25 bg-[#10b981]/12 text-[#a7f3d0] flex items-center justify-center font-bold text-sm uppercase shrink-0">
                            {item.userName.charAt(0)}
                          </div>
                          <span className="font-bold text-white text-sm truncate max-w-[220px]">
                            {item.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-semibold text-[#c8d2bd]">
                          {item.department || "BEM FT"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {getWorkloadBadge(item.committeeCount)}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#a9b49c] hover:text-white hover:bg-white/5 rounded-lg"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-[#a9b49c] italic bg-white/3"
                  >
                    {search
                      ? "Tidak ada anggota yang cocok dengan pencarian."
                      : "Belum ada fungsionaris aktif yang tercatat."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
