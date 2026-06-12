"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { meetingsService, Meeting } from "@/lib/api/meetings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Search,
  Plus,
  Video,
  MapPin,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MeetingsFormDialog } from "@/components/meetings/meetings-form-dialog";
import { useAuth } from "@/hooks/useAuth";

export default function MeetingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all meetings
  const { data: meetingsResponse, isLoading } = useQuery({
    queryKey: ["ims-meetings"],
    queryFn: () => meetingsService.list(),
  });

  const meetings = meetingsResponse?.data || [];

  // Create meeting mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Meeting>) => meetingsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-meetings"] });
      setDialogOpen(false);
    },
  });

  const handleCreateMeeting = (data: Partial<Meeting>) => {
    // Inject current date/time if date is relative or empty, but date should be set in form
    createMutation.mutate(data);
  };

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(search.toLowerCase()),
  );

  const getMeetingStatusBadge = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const now = new Date();

    // Reset hours to make clean date comparison
    meetingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (meetingDate < today) {
      return (
        <Badge
          variant="outline"
          className="bg-muted/30 text-muted-foreground border-muted-foreground/20"
        >
          Selesai
        </Badge>
      );
    } else if (meetingDate.getTime() === today.getTime()) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
          Hari Ini
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-accent/10 text-accent border-accent/20">
          Mendatang
        </Badge>
      );
    }
  };

  // Check if current user is Kadep or BPI (authorized to schedule meetings)
  const canCreate =
    user?.role === "Super Admin" ||
    user?.role === "Kadep" ||
    user?.role === "Sekretaris";

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Presensi & Notulensi Rapat
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kelola agenda rapat fungsionaris, generate QR absensi digital, dan
            simpan notulensi rapat terpusat.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shrink-0 shadow-lg shadow-accent/15"
          >
            <Plus className="w-4 h-4" />
            Buat Agenda Rapat
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/20 backdrop-blur-xs">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent/10 text-accent">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Rapat
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {meetings.length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/20 backdrop-blur-xs">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Rapat Selesai
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {meetings.filter((m) => new Date(m.date) < new Date()).length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/20 backdrop-blur-xs">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Rapat Mendatang
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {meetings.filter((m) => new Date(m.date) >= new Date()).length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />
                Jadwal & Riwayat Rapat
              </CardTitle>
              <CardDescription>
                Klik rapat untuk membuka QR Code presensi digital, daftar
                kehadiran, dan notulensi.
              </CardDescription>
            </div>
            <div className="relative max-w-sm w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari agenda rapat..."
                className="pl-10 bg-background/50 border-border/50 focus:border-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/30">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[350px]">Agenda Rapat</TableHead>
                  <TableHead>Tanggal Pelaksanaan</TableHead>
                  <TableHead>Lokasi / Media</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredMeetings.length > 0 ? (
                  filteredMeetings.map((meeting) => (
                    <TableRow
                      key={meeting._id}
                      className="hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => router.push(`/meetings/${meeting._id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            RP
                          </div>
                          <span className="font-semibold text-sm text-foreground truncate max-w-[280px]">
                            {meeting.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {new Date(meeting.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          {meeting.location?.toLowerCase().includes("zoom") ||
                          meeting.location?.toLowerCase().includes("gmeet") ||
                          meeting.location?.toLowerCase().includes("online") ? (
                            <Video className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
                          )}
                          {meeting.location || "Belum ditentukan"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getMeetingStatusBadge(meeting.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      {search
                        ? "Tidak ada rapat yang cocok dengan pencarian."
                        : "Belum ada agenda rapat yang dibuat."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MeetingsFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateMeeting}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
