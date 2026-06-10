"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  Settings,
  LogOut,
  User,
  Command,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Header({
  setSidebarOpen,
}: {
  setSidebarOpen: (v: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Simple breadcrumb logic based on pathname
  const pathNameSegment =
    pathname === "/"
      ? "Dashboard Overview"
      : pathname.split("/")[1].charAt(0).toUpperCase() +
        pathname.split("/")[1].slice(1);

  const mockNotifications = [
    {
      id: 1,
      title: "Proposal disetujui!",
      desc: "Proposal PKKMB 2026 disetujui Bendahara BEM.",
      time: "5 menit lalu",
    },
    {
      id: 2,
      title: "Undangan Surat",
      desc: "Anda diundang ke rapat Pleno Koordinasi Mid-Term.",
      time: "1 jam lalu",
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-white/10 bg-[#091c11]/62 px-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          className="-m-2.5 rounded-lg p-2.5 text-[#b8c4aa] hover:bg-white/8 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Breadcrumb / Title */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-[#10b981]">
            <ShieldCheck className="h-3.5 w-3.5" />
            IMS Command Center
          </div>
          <h1 className="mt-1 text-lg font-semibold text-white">
            {pathNameSegment}
          </h1>
        </div>
      </div>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-end">
        {/* Global Search */}
        <div className="relative hidden w-full max-w-sm md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-[#10b981]" aria-hidden="true" />
          </div>
          <Input
            type="search"
            placeholder="Ketik untuk mencari..."
            className="h-10 w-full border-white/10 bg-white/8 pl-10 pr-12 text-sm text-white placeholder:text-[#a9b49c] focus:border-[#10b981]"
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 hidden items-center gap-1 text-[10px] text-[#a9b49c] lg:flex">
            <Command className="h-3 w-3" />K
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-[#b8c4aa] hover:bg-white/8 hover:text-white"
                onClick={() => setUnreadNotifications(false)}
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadNotifications && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#10b981] ring-2 ring-[#091c11]"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 border-white/10 bg-[#091c11]/95 p-2 text-white backdrop-blur-xl"
            >
              <DropdownMenuLabel className="font-bold text-sm">
                Notifikasi
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mockNotifications.map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className="flex flex-col items-start gap-1 rounded-lg p-3 hover:bg-white/8"
                >
                  <span className="font-bold text-xs text-foreground">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-[#a9b49c] leading-normal">
                    {notif.desc}
                  </span>
                  <span className="mt-1 text-[8px] text-[#10b981]">
                    {notif.time}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-white/10"
            aria-hidden="true"
          />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex cursor-pointer items-center gap-x-3 rounded-full border border-white/10 bg-white/6 p-1.5 transition-colors hover:bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="h-8 w-8 rounded-full bg-card object-cover ring-1 ring-white/20"
                  src={
                    !imgError && user?.avatar
                      ? user.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=10b981&color=fff`
                  }
                  onError={() => setImgError(true)}
                  alt=""
                />
                <span className="hidden lg:flex lg:items-center">
                  <span
                    className="ml-2 text-sm font-semibold leading-6 text-white"
                    aria-hidden="true"
                  >
                    {user?.name || "Guest User"}
                  </span>
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border-white/10 bg-[#091c11]/95 text-white backdrop-blur-xl"
            >
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Profil
                Anggota
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => router.push("/users")}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />{" "}
                Pengaturan Akses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin keluar?")) {
                    logout();
                  }
                }}
              >
                <LogOut className="w-4 h-4" /> Keluar Sesi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
