"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pointsService, Points, GivePointsDto } from "@/lib/api/points";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Plus,
  Search,
  History,
  TrendingUp,
  Award,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { GivePointsDialog } from "@/components/reward/give-points-dialog";

export default function RewardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: leaderboardResponse, isLoading: isLeaderboardLoading } =
    useQuery({
      queryKey: ["ims-points-leaderboard"],
      queryFn: () => pointsService.getLeaderboard(),
    });

  const leaderboard = leaderboardResponse?.data || [];

  const giveMutation = useMutation({
    mutationFn: (newPoint: GivePointsDto) => pointsService.givePoints(newPoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-points-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["ims-points-history"] });
      setIsFormOpen(false);
      alert("Poin berhasil diberikan!");
    },
  });

  const filteredLeaderboard = leaderboard.filter((item) =>
    item.userName.toLowerCase().includes(search.toLowerCase()),
  );

  const topThree = leaderboard.slice(0, 3);
  const remainingUsers = filteredLeaderboard.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sistem Reward & Leaderboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Apresiasi kinerja fungsionaris teraktif melalui sistem poin
            gamifikasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/reward/history")}
            className="border-border/50 bg-card gap-2"
          >
            <History className="w-4 h-4" />
            Riwayat Poin
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            Berikan Poin
          </Button>
        </div>
      </div>

      {/* Podium Top 3 */}
      {!isLeaderboardLoading && topThree.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto items-end pt-8">
          {/* Rank 2 */}
          {topThree[1] && (
            <Card className="border-border/50 bg-card/20 backdrop-blur-sm order-2 md:order-1 h-[220px] flex flex-col justify-end items-center pb-6 text-center border-t-4 border-t-slate-400 relative">
              <div className="absolute top-4 p-2 bg-slate-400/20 text-slate-400 rounded-full">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm">
                  {topThree[1].userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topThree[1].department}
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 bg-slate-400/10 text-slate-400 border-slate-400/20 font-bold"
                >
                  {topThree[1].totalPoints || 0} Pts
                </Badge>
              </div>
            </Card>
          )}

          {/* Rank 1 (Crown) */}
          {topThree[0] && (
            <Card className="border-accent/50 bg-card/40 backdrop-blur-sm order-1 md:order-2 h-[260px] flex flex-col justify-end items-center pb-8 text-center border-t-8 border-t-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.15)] relative scale-105">
              <div className="absolute top-4 p-3 bg-yellow-500/20 text-yellow-500 rounded-full animate-bounce">
                <Crown className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-foreground text-md">
                  {topThree[0].userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topThree[0].department}
                </p>
                <Badge className="mt-2 bg-yellow-500 text-yellow-950 hover:bg-yellow-500 font-extrabold">
                  {topThree[0].totalPoints || 0} Pts
                </Badge>
              </div>
            </Card>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <Card className="border-border/50 bg-card/20 backdrop-blur-sm order-3 h-[180px] flex flex-col justify-end items-center pb-6 text-center border-t-4 border-t-amber-600 relative">
              <div className="absolute top-4 p-2 bg-amber-600/20 text-amber-600 rounded-full">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm">
                  {topThree[2].userName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topThree[2].department}
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 bg-amber-600/10 text-amber-600 border-amber-600/20 font-bold"
                >
                  {topThree[2].totalPoints || 0} Pts
                </Badge>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Leaderboard Rankings List */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Klasemen Keaktifan Fungsionaris
              </CardTitle>
              <CardDescription>
                Peringkat keaktifan fungsionaris BEM FT berdasarkan akumulasi
                perolehan poin.
              </CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari fungsionaris..."
                className="pl-10 bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px] text-center">Rank</TableHead>
                  <TableHead className="w-[300px]">Fungsionaris</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead className="text-right">
                    Akumulasi Reward Poin
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLeaderboardLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-6 bg-muted animate-pulse rounded mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((item, idx) => (
                    <TableRow
                      key={item.userId}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="text-center font-extrabold text-sm text-foreground">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {item.userName.charAt(0)}
                          </div>
                          <span className="font-semibold text-sm text-foreground truncate">
                            {item.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {item.department || "BEM FT"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-accent">
                        {item.totalPoints || 0} Pts
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      {search
                        ? "Tidak ada anggota yang cocok dengan pencarian."
                        : "Belum ada klasemen yang tercatat."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <GivePointsDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={(data) => giveMutation.mutate(data)}
        isLoading={giveMutation.isPending}
      />
    </div>
  );
}
