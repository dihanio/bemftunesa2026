"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  ChevronDown,
  Shield,
  User,
  LogOut,
  Sparkles,
  Command,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
}

export function Topbar({ onSearchClick, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for glass styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Format breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, href };
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b px-6 transition-all duration-300",
        scrolled
          ? "border-white/10 bg-[#091c11]/75 shadow-lg backdrop-blur-md"
          : "border-white/5 bg-transparent",
      )}
    >
      {/* Left: Breadcrumbs & Mobile Toggle */}
      <div className="flex items-center gap-3 text-xs font-semibold text-[#a9b49c]">
        {onMenuClick && (
          <button
            type="button"
            className="rounded-lg p-1.5 hover:bg-white/8 lg:hidden text-white"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="cursor-pointer hover:text-white transition-colors">
          IMS
        </span>
        {breadcrumbs.map((crumb, idx) => (
          <div key={crumb.href} className="flex items-center gap-2">
            <span>/</span>
            <span
              className={cn(
                "transition-colors",
                idx === breadcrumbs.length - 1
                  ? "text-white font-bold"
                  : "cursor-pointer hover:text-white",
              )}
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </div>

      {/* Right: Search, Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Command Search Trigger */}
        <button
          onClick={onSearchClick}
          className="flex h-10 w-48 items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 text-left text-xs text-[#a9b49c] transition-all hover:border-white/20 hover:bg-white/8 md:w-64"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#10b981]" />
            Cari menu atau tugas...
          </span>
          <span className="flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white">
            <Command className="h-2 w-2" />K
          </span>
        </button>

        {/* Role Switcher */}
        {user && user.roles && user.roles.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/8"
              >
                <Shield className="h-3.5 w-3.5 text-[#10b981]" />
                <span className="max-w-[120px] truncate">{activeRole}</span>
                <ChevronDown className="h-3 w-3 text-[#a9b49c]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-white/10 bg-[#091c11]/90 text-white shadow-2xl backdrop-blur-lg"
            >
              <DropdownMenuLabel className="text-xs text-[#a9b49c]">
                Pilih Peran Aktif
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {user.roles.map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    "cursor-pointer text-xs font-semibold hover:bg-white/8 focus:bg-white/8 focus:text-white",
                    activeRole === role ? "text-[#10b981]" : "text-white",
                  )}
                >
                  <span
                    className={cn(
                      "mr-2 h-2 w-2 rounded-full",
                      activeRole === role ? "bg-[#10b981]" : "bg-transparent",
                    )}
                  />
                  {role}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#10b981]/10 px-3 py-1.5 text-xs font-semibold text-[#a7f3d0]">
            <Shield className="h-3.5 w-3.5 text-[#10b981]" />
            {activeRole || user?.role || "Guest"}
          </div>
        )}

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/8 text-[#a9b49c] hover:text-white"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff7a7a]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 border-white/10 bg-[#091c11]/90 text-white shadow-2xl backdrop-blur-lg"
          >
            <DropdownMenuLabel className="flex items-center justify-between text-xs text-[#a9b49c]">
              <span>Notifikasi Terbaru</span>
              <span className="cursor-pointer hover:text-white">
                Tandai dibaca
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="p-3 text-center text-xs text-[#a9b49c]">
              Tidak ada notifikasi baru
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full border border-white/10 p-0 hover:bg-white/8"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-white/10 text-xs font-bold text-white">
                  {user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-white/10 bg-[#091c11]/90 text-white shadow-2xl backdrop-blur-lg"
          >
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white">{user?.name}</span>
              <span className="text-[10px] text-[#a9b49c]">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="cursor-pointer text-xs focus:bg-white/8 focus:text-white"
            >
              <User className="mr-2 h-4 w-4 text-[#10b981]" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin keluar?")) {
                  logout();
                }
              }}
              className="cursor-pointer text-xs text-[#ff9b9b] focus:bg-[#ff7a7a]/10 focus:text-[#ff9b9b]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
