"use client";

import { useQuery } from "@tanstack/react-query";
import { pointsService } from "@/lib/api/points";
import { usersService } from "@/lib/api/users";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Coins, Calendar } from "lucide-react";
import Link from "next/link";

export default function PointHistoryPage() {
  const { data: pointsResponse, isLoading: isPointsLoading } = useQuery({
    queryKey: ["ims-points-history"],
    queryFn: () => pointsService.list(),
  });

  const { data: usersResponse } = useQuery({
    queryKey: ["ims-users-points-lookup"],
    queryFn: () => usersService.list(),
  });

  const points = pointsResponse?.data || [];
  const users = usersResponse?.data || [];

  const getUserName = (userId: string) => {
    return users.find((u) => u._id === userId)?.name || "Fungsionaris BEM FT";
  };

  const getCategoryBadge = (type: string) => {
    switch (type) {
      case "kehadiran":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Kehadiran
          </Badge>
        );
      case "proker":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Proker
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">
            Lainnya
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/reward"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Leaderboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Riwayat Perolehan Poin
            </h1>
            <p className="mt-2 text-muted-foreground text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4 text-accent" /> Log komparatif
              transaksi reward poin fungsionaris.
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            Semua Transaksi Poin
          </CardTitle>
          <CardDescription>
            Catatan audit lengkap perolehan poin fungsionaris aktif BEM FT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[250px]">Fungsionaris</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keterangan Alasan</TableHead>
                  <TableHead className="text-right">Jumlah Poin (+)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPointsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : points.length > 0 ? (
                  points.map((p) => (
                    <TableRow
                      key={p._id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground">
                        {getUserName(p.userId)}
                      </TableCell>
                      <TableCell>{getCategoryBadge(p.type)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-normal max-w-sm truncate">
                        {p.description}
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-emerald-500">
                        +{p.points} Pts
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      Belum ada riwayat perolehan poin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
