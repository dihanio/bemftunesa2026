"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/api/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  UserMinus,
  ShieldAlert,
} from "lucide-react";

export default function WorkloadPage() {
  const { data: deptWorkloadRes, isLoading: isDeptLoading } = useQuery({
    queryKey: ["workload-departments"],
    queryFn: () => dashboardService.getWorkload(),
  });

  const { data: memberWorkloadRes, isLoading: isMemberLoading } = useQuery({
    queryKey: ["workload-members"],
    queryFn: () => dashboardService.getMemberWorkload(),
  });

  const departments = deptWorkloadRes?.data || [];
  const members = memberWorkloadRes?.data || [];

  const overloadedMembers = members.filter((m) => m.assignments >= 3);
  const inactiveMembers = members.filter((m) => m.assignments === 0);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "overloaded":
        return "bg-red-950/20 text-red-200 border-red-800/40";
      case "watch":
      case "inactive":
        return "bg-yellow-950/20 text-yellow-200 border-yellow-800/40";
      default:
        return "bg-green-950/20 text-green-200 border-green-800/40";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#10b981]" />
            Analisis Beban Kerja (HR Analytics)
          </h1>
          <p className="text-xs text-[#a9b49c]">
            Pantau sebaran fungsionaris dalam kepanitiaan, identifikasi
            kejenuhan (burnout), dan fungsionaris nonaktif.
          </p>
        </div>
      </div>

      {/* Warning/Alert if any overloaded members */}
      {overloadedMembers.length > 0 && (
        <Alert className="border-red-800/40 bg-red-950/20 text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold text-white">
            Fungsionaris Mengalami Overload!
          </AlertTitle>
          <AlertDescription className="text-xs">
            Terdapat {overloadedMembers.length} fungsionaris yang aktif di lebih
            dari 2 kepanitiaan secara bersamaan. Harap pertimbangkan kembali
            sebelum menunjuk PJ atau panitia baru.
          </AlertDescription>
        </Alert>
      )}

      {/* Department Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isDeptLoading ? (
          <p className="text-xs text-[#a9b49c]">Memuat sebaran departemen...</p>
        ) : (
          departments.map((dept) => (
            <Card
              key={dept.departmentId}
              className="border-white/10 bg-white/5 backdrop-blur-md"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black text-[#a9b49c]">
                  {dept.departmentName}
                </CardTitle>
                <CardDescription className="text-[10px] text-white/50">
                  {dept.department}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-white">
                    {dept.loadScore}%
                  </span>
                  <span className="text-[10px] text-[#a9b49c]">
                    Beban Kerja
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${
                      dept.loadScore >= 80
                        ? "bg-red-500"
                        : dept.loadScore >= 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${dept.loadScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#a9b49c]">
                  <span>{dept.members} Anggota</span>
                  <span>{dept.assignments} Tugas Panitia</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Grid: Workload Matrix & Inactive Members */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workload Matrix */}
        <Card className="lg:col-span-2 border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#10b981]" />
              Matriks Beban Kerja Anggota
            </CardTitle>
            <CardDescription className="text-[10px] text-[#a9b49c]">
              Seluruh fungsionaris aktif beserta alokasi kepanitiaan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="border-white/10">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white text-xs">Nama</TableHead>
                  <TableHead className="text-white text-xs">Dept</TableHead>
                  <TableHead className="text-white text-xs">Tugas</TableHead>
                  <TableHead className="text-white text-xs">
                    Skor Beban
                  </TableHead>
                  <TableHead className="text-white text-xs text-right">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMemberLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-[#a9b49c] text-xs"
                    >
                      Memuat data beban kerja...
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-[#a9b49c] text-xs"
                    >
                      Tidak ada fungsionaris ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow
                      key={m.userId}
                      className="border-white/5 hover:bg-white/5"
                    >
                      <TableCell className="font-semibold text-white text-xs">
                        {m.name}
                      </TableCell>
                      <TableCell className="text-[#a9b49c] text-xs">
                        {m.department}
                      </TableCell>
                      <TableCell className="text-white font-bold text-xs">
                        {m.assignments}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${
                                m.loadScore >= 75
                                  ? "bg-red-500"
                                  : m.loadScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${m.loadScore}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#a9b49c] min-w-[24px] text-right">
                            {m.loadScore}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${getRiskBadgeColor(m.risk)}`}
                        >
                          {m.risk === "overloaded"
                            ? "Overload"
                            : m.risk === "inactive"
                              ? "Nonaktif"
                              : "Normal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Side Panel: Inactive & Overloaded Quick List */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-white flex items-center gap-1">
                <UserMinus className="h-4 w-4 text-[#10b981]" />
                Anggota Nonaktif ({inactiveMembers.length})
              </CardTitle>
              <CardDescription className="text-[9px] text-[#a9b49c]">
                Fungsionaris yang belum memiliki kepanitiaan aktif
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 max-h-[220px] overflow-y-auto">
              {inactiveMembers.length === 0 ? (
                <p className="text-[10px] text-[#a9b49c] italic">
                  Seluruh anggota aktif bertugas.
                </p>
              ) : (
                inactiveMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex justify-between items-center rounded border border-white/5 bg-white/5 p-2 text-[10px]"
                  >
                    <span className="font-bold text-white">{m.name}</span>
                    <span className="text-[#a9b49c]">{m.department}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-white flex items-center gap-1">
                <ShieldAlert className="h-4 w-4 text-[#10b981]" />
                Anggota Overload ({overloadedMembers.length})
              </CardTitle>
              <CardDescription className="text-[9px] text-[#a9b49c]">
                Anggota dengan tugas &gt;= 3 kepanitiaan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 max-h-[220px] overflow-y-auto">
              {overloadedMembers.length === 0 ? (
                <p className="text-[10px] text-[#a9b49c] italic">
                  Tidak ada anggota teridentifikasi overload.
                </p>
              ) : (
                overloadedMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex justify-between items-center rounded border border-white/5 bg-white/5 p-2 text-[10px]"
                  >
                    <span className="font-bold text-white">{m.name}</span>
                    <Badge variant="destructive" className="text-[8px] py-0">
                      {m.assignments} Tugas
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
