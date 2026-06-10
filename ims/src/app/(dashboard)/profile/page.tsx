"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Shield,
  Award,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Building,
  KeyRound,
  CheckCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { user, activeRole } = useAuth();
  const [successMsg, setSuccessMsg] = useState("");
  const [phone, setPhone] = useState(
    (user as any)?.phone || "+62 812-3456-7890",
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Profil berhasil diperbarui secara lokal!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header Profile Section */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
        <div className="absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-[#10b981]/10" />

        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Avatar Container with Outer Glow */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-linear-to-r from-[#10b981] to-[#a7f3d0] opacity-75 blur-md" />
            <Avatar className="relative h-24 w-24 border-2 border-white/20">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-[#091c11] text-2xl font-black text-white">
                {user?.name?.slice(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-black text-white">
              {user?.name || "Guest Fungsionaris"}
            </h1>
            <p className="mt-1 text-sm text-[#a9b49c]">{user?.email}</p>

            {/* Roles Badges Row */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
              {user?.roles?.map((role) => (
                <span
                  key={role}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    role === activeRole
                      ? "bg-[#10b981] text-white border border-white/10 shadow"
                      : "bg-white/5 text-[#a9b49c] border border-white/5"
                  }`}
                >
                  {role} {role === activeRole && "⚡"}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#10b981]">
                Peran Aktif
              </span>
              <span className="mt-1 block text-sm font-black text-white truncate max-w-[120px]">
                {activeRole || "Staff"}
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#a7f3d0]">
                Status Akun
              </span>
              <span className="mt-1 text-xs font-semibold text-[#71d39b] flex items-center justify-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left Side: Points & Rank Card */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur-md">
            <CardHeader className="border-b border-white/10 pb-3.5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-[#f0c36a]" />
                Kinerja Keaktifan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-[10px] text-[#a9b49c] font-semibold uppercase">
                  Poin Keaktifan
                </span>
                <span className="mt-1 block text-3xl font-black text-white">
                  1,450 Poin
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#a9b49c] font-medium">
                  <span>Peringkat Departemen</span>
                  <span className="text-white font-bold">Rank 3 / 24</span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-[#f0c36a] rounded-full"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Navigation Tabs */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 border border-white/10 bg-black/20 text-white rounded-lg p-1">
              <TabsTrigger
                value="info"
                className="rounded-md py-2 text-xs font-semibold data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
              >
                <User className="mr-2 h-3.5 w-3.5" />
                Detail Diri
              </TabsTrigger>
              <TabsTrigger
                value="panitia"
                className="rounded-md py-2 text-xs font-semibold data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
              >
                <Building className="mr-2 h-3.5 w-3.5" />
                Kepanitiaan
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-md py-2 text-xs font-semibold data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
              >
                <KeyRound className="mr-2 h-3.5 w-3.5" />
                Keamanan
              </TabsTrigger>
            </TabsList>

            {/* Tab: Detail Diri */}
            <TabsContent value="info" className="mt-6">
              <form onSubmit={handleSave} className="space-y-4">
                {successMsg && (
                  <div className="rounded-lg border border-[#71d39b]/20 bg-[#71d39b]/10 p-3 text-xs text-[#71d39b] font-medium">
                    {successMsg}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#a9b49c]">
                      Nama Lengkap
                    </Label>
                    <Input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="border-white/10 bg-white/5 text-white disabled:opacity-75"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#a9b49c]">Email</Label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="border-white/10 bg-white/5 text-white disabled:opacity-75"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#a9b49c]">
                      Nomor Telepon
                    </Label>
                    <Input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-white/10 bg-white/5 text-white focus:border-[#10b981]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#a9b49c]">
                      Departemen / Bidang
                    </Label>
                    <Input
                      type="text"
                      value={user?.department || "Fakultas Teknik"}
                      disabled
                      className="border-white/10 bg-white/5 text-white disabled:opacity-75"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="rounded-full bg-[#10b981] text-white hover:bg-[#7a9362]"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab: Kepanitiaan */}
            <TabsContent value="panitia" className="mt-6">
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/3 p-4 flex justify-between items-center">
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-white">
                      PKKMB FT 2026
                    </span>
                    <span className="text-[10px] text-[#a9b49c]">
                      Ketua Pelaksana
                    </span>
                  </div>
                  <span className="rounded bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-bold text-[#10b981]">
                    Berjalan
                  </span>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/3 p-4 flex justify-between items-center">
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-white">
                      Dies Natalis UNESA 2025
                    </span>
                    <span className="text-[10px] text-[#a9b49c]">
                      Sekretaris Panitia
                    </span>
                  </div>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-[#a9b49c]">
                    Selesai
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Keamanan */}
            <TabsContent value="security" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSuccessMsg("Kata sandi berhasil diubah!");
                  setTimeout(() => setSuccessMsg(""), 3000);
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#a9b49c]">
                    Kata Sandi Saat Ini
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="border-white/10 bg-white/5 text-white placeholder-white/20 focus:border-[#10b981]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#a9b49c]">
                    Kata Sandi Baru
                  </Label>
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    className="border-white/10 bg-white/5 text-white placeholder-white/20 focus:border-[#10b981]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="rounded-full bg-[#10b981] text-white hover:bg-[#7a9362]"
                  >
                    Perbarui Kata Sandi
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
