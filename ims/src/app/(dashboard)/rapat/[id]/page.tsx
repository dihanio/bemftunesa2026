"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { meetingsService, Meeting } from "@/lib/api/meetings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle,
  Clock,
  QrCode,
  FileText,
  Save,
  Scan,
  UserCheck,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const { user } = useAuth();

  const [noteContent, setNoteContent] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Queries
  const { data: detailResponse, isLoading } = useQuery({
    queryKey: ["ims-meeting-detail", id],
    queryFn: () => meetingsService.getDetail(id),
  });

  const detail = detailResponse?.data;
  const meeting = detail?.meeting;
  const notes = detail?.notes;
  const attendance = detail?.attendance || [];

  // Sync notes content when loaded
  useEffect(() => {
    if (notes) {
      setNoteContent(notes.content);
    }
  }, [notes]);

  // Mutations
  const attendMutation = useMutation({
    mutationFn: (coords?: { latitude: number; longitude: number }) =>
      meetingsService.attend(
        id,
        user?.id || "",
        coords?.latitude,
        coords?.longitude,
      ),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-meeting-detail", id] });
      setSuccessMsg(res.message || "Absensi berhasil dicatat!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal melakukan absensi.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: (content: string) =>
      meetingsService.addNotes(id, content, user?.id || ""),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-meeting-detail", id] });
      setSuccessMsg("Notulensi berhasil disimpan!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal menyimpan notulensi.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Clock className="w-8 h-8 text-accent animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat detail rapat...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground italic">Rapat tidak ditemukan.</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/meetings")}
          className="mt-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
      </div>
    );
  }

  const handleAttendSimulate = () => {
    if (
      meeting.latitude !== undefined &&
      meeting.latitude !== null &&
      meeting.longitude !== undefined &&
      meeting.longitude !== null
    ) {
      if (!navigator.geolocation) {
        setErrorMsg("Browser Anda tidak mendukung Geolocation API.");
        setTimeout(() => setErrorMsg(""), 4000);
        return;
      }

      setSuccessMsg("Mencari sinyal GPS dan koordinat lokasi Anda...");
      setTimeout(() => setSuccessMsg(""), 3000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          attendMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let msg = "Gagal mengakses lokasi GPS.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Izin akses lokasi GPS ditolak oleh browser/pengguna.";
          }
          setErrorMsg(msg);
          setTimeout(() => setErrorMsg(""), 4000);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      attendMutation.mutate(undefined);
    }
  };

  const handleSaveNotes = () => {
    saveNotesMutation.mutate(noteContent);
  };

  const isSecretaryOrAdmin =
    user?.role === "Super Admin" || user?.role === "Sekretaris";
  const userHasAttended = attendance.some(
    (record) => record.userId._id === user?.id,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ease-out">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/meetings")}
          className="border-border/50 bg-background/50 hover:bg-muted/20 h-9 w-9"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Button>
        <div>
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Agenda Rapat Internal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            {meeting.title}
          </h1>
        </div>
      </div>

      {/* Dynamic Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Meeting Info & QR Code */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Detail Pelaksanaan
              </CardTitle>
              <CardDescription>
                Informasi waktu dan tempat rapat BEM FT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Waktu
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {new Date(meeting.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Lokasi / Media
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {meeting.location || "Belum ditentukan"}
                  </p>
                </div>
              </div>

              {meeting.latitude !== undefined &&
                meeting.latitude !== null &&
                meeting.longitude !== undefined &&
                meeting.longitude !== null && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border/20">
                    <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Verifikasi GPS Aktif
                      </p>
                      <p className="text-xs text-foreground font-semibold mt-0.5">
                        Titik: {meeting.latitude.toFixed(5)},{" "}
                        {meeting.longitude.toFixed(5)}
                      </p>
                      <p className="text-[10px] text-accent font-medium mt-0.5">
                        Batas Jarak Radius: {meeting.radius || 50} meter
                      </p>
                    </div>
                  </div>
                )}

              {meeting.prokerId && (
                <div className="flex items-start gap-3 pt-2 border-t border-border/20">
                  <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Program Kerja
                    </p>
                    <p className="text-xs text-blue-300 font-medium mt-0.5">
                      Rapat terkait program kerja terdaftar
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Presensi QR Card */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3">
              <Badge
                className={
                  userHasAttended
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-accent/10 text-accent border-accent/20"
                }
              >
                {userHasAttended ? "Sudah Hadir" : "Belum Hadir"}
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-accent" />
                Presensi Digital QR
              </CardTitle>
              <CardDescription>
                Pindai kode QR untuk melakukan absensi kehadiran mandiri.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 text-center">
              {/* High-Tech QR Scanner Visual Mockup */}
              <div className="relative w-48 h-48 border border-white/10 rounded-2xl bg-black/40 flex items-center justify-center p-3 shadow-inner mb-6 group">
                {/* Neon Corner Brackets */}
                <div className="absolute top-0 left-0 border-t-2 border-l-2 w-5 h-5 border-accent rounded-tl-xl" />
                <div className="absolute top-0 right-0 border-t-2 border-r-2 w-5 h-5 border-accent rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 border-b-2 border-l-2 w-5 h-5 border-accent rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 border-b-2 border-r-2 w-5 h-5 border-accent rounded-br-xl" />

                {/* Glowing Laser Scan Line */}
                <div className="absolute left-0 right-0 h-[2px] bg-accent/60 shadow-[0_0_12px_#10b981] z-10 animate-[bounce_3s_infinite]" />

                {/* High Tech Matrix Pattern QR Simulator */}
                <div className="w-full h-full opacity-85 grid grid-cols-4 gap-1 p-2 bg-white rounded-lg select-none">
                  {/* Position detection markers */}
                  <div className="border-[3px] border-black w-8 h-8 rounded bg-transparent p-0.5">
                    <div className="w-full h-full bg-black rounded-xs"></div>
                  </div>
                  <div className="bg-transparent"></div>
                  <div className="bg-transparent"></div>
                  <div className="border-[3px] border-black w-8 h-8 rounded bg-transparent p-0.5 ml-auto">
                    <div className="w-full h-full bg-black rounded-xs"></div>
                  </div>

                  <div className="bg-black h-4 rounded-xs"></div>
                  <div className="bg-black h-4 w-4 rounded-xs mx-auto"></div>
                  <div className="bg-black h-4 w-6 rounded-xs ml-auto"></div>
                  <div className="bg-transparent"></div>

                  <div className="bg-transparent"></div>
                  <div className="bg-black h-6 w-6 rounded-xs"></div>
                  <div className="bg-black h-4 w-4 rounded-xs"></div>
                  <div className="bg-black h-5 w-5 rounded-xs ml-auto"></div>

                  <div className="border-[3px] border-black w-8 h-8 rounded bg-transparent p-0.5 mt-auto">
                    <div className="w-full h-full bg-black rounded-xs"></div>
                  </div>
                  <div className="bg-transparent"></div>
                  <div className="bg-black h-4 w-4 rounded-xs mt-auto"></div>
                  <div className="bg-black h-6 w-8 rounded-xs mt-auto ml-auto"></div>
                </div>
              </div>

              {!userHasAttended ? (
                <Button
                  onClick={handleAttendSimulate}
                  disabled={attendMutation.isPending}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 font-bold py-5 shadow-lg shadow-accent/15"
                >
                  <Scan className="w-4 h-4 animate-pulse" />
                  Simulasi Scan Presensi
                </Button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm">
                  <UserCheck className="w-4 h-4" />
                  Kehadiran Anda Terverifikasi
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Tabs for Attendance and Minutes (Notulensi) */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-border/50 rounded-xl p-1">
              <TabsTrigger
                value="attendance"
                className="rounded-lg gap-2 text-sm font-semibold"
              >
                <Users className="w-4 h-4" />
                Kehadiran ({attendance.length})
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-lg gap-2 text-sm font-semibold"
              >
                <FileText className="w-4 h-4" />
                Notulensi Rapat
              </TabsTrigger>
            </TabsList>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="mt-6">
              <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-accent" />
                    Fungsionaris Hadir
                  </CardTitle>
                  <CardDescription>
                    Daftar anggota BEM FT UNESA yang terverifikasi hadir dalam
                    rapat ini.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attendance.length > 0 ? (
                    <div className="space-y-4">
                      {attendance.map((record) => (
                        <div
                          key={record._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-background/20 hover:bg-background/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center font-bold text-xs shrink-0">
                              {record.userId.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {record.userId.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {record.userId.nim} • {record.userId.role}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border bg-background/40 text-muted-foreground font-mono"
                          >
                            {new Date(record.attendedAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}{" "}
                            WIB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground italic text-sm">
                      Belum ada fungsionaris yang melakukan scan kehadiran.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meeting Notes (Notulensi) Tab */}
            <TabsContent value="notes" className="mt-6">
              <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent" />
                        Dokumentasi Notulensi
                      </CardTitle>
                      <CardDescription>
                        Pencatatan resmi pembahasan dan kesimpulan rapat.
                      </CardDescription>
                    </div>
                    {isSecretaryOrAdmin && (
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={saveNotesMutation.isPending}
                        className="bg-[#10b981] hover:bg-[#10b981]/90 text-white gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Simpan
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isSecretaryOrAdmin ? (
                    <div className="space-y-2">
                      <Textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Tuliskan agenda pembahasan, poin-poin penting, kepanitiaan yang terbentuk, serta tenggat waktu program kerja di sini..."
                        className="min-h-[250px] bg-background/50 border-border/50 text-sm leading-relaxed p-4"
                      />
                      <p className="text-xs text-muted-foreground italic">
                        * Hanya fungsionaris dengan peran Sekretaris atau Super
                        Admin yang dapat mengedit notulensi.
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-border/30 bg-background/10 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {notes?.content || (
                        <span className="text-muted-foreground italic text-xs">
                          Belum ada notulensi yang diinputkan untuk rapat ini.
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
