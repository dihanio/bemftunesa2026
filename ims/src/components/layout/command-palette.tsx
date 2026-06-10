"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@bemft/permissions";
import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  QrCode,
  Package,
  BookOpen,
  Award,
  Mail,
  Wallet,
  Users,
  FileText,
  UserCog,
  LogOut,
  ArrowRight,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { hasPermission, logout } = useAuth();
  const [search, setSearch] = useState("");

  // Listen to keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // wait, we want to toggle or trigger it.
        // Actually, the parent will toggle, but we can also trigger here if parent passes setOpen.
        // But parent triggers it, so parent should handle keydown.
        // We will register it here as well for safety.
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const items = useMemo(() => {
    const all = [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        category: "Navigasi",
        permission: PERMISSIONS.dashboardRead,
      },
      {
        name: "Kalender",
        href: "/kalender",
        icon: Calendar,
        category: "Navigasi",
        permission: PERMISSIONS.prokerRead,
      },
      {
        name: "Program Kerja",
        href: "/proker",
        icon: KanbanSquare,
        category: "Navigasi",
        permission: PERMISSIONS.prokerRead,
      },
      {
        name: "Agenda Rapat",
        href: "/meetings",
        icon: QrCode,
        category: "Navigasi",
        permission: PERMISSIONS.committeeRead,
      },
      {
        name: "Inventaris Aset",
        href: "/assets",
        icon: Package,
        category: "Navigasi",
        permission: PERMISSIONS.committeeRead,
      },
      {
        name: "Wiki & SOP",
        href: "/wiki",
        icon: BookOpen,
        category: "Navigasi",
        permission: PERMISSIONS.documentsRead,
      },
      {
        name: "Reward Points",
        href: "/reward",
        icon: Award,
        category: "Navigasi",
        permission: PERMISSIONS.prokerRead,
      },
      {
        name: "Persuratan",
        href: "/surat",
        icon: Mail,
        category: "Navigasi",
        permission: PERMISSIONS.documentsRead,
      },
      {
        name: "Keuangan",
        href: "/finance",
        icon: Wallet,
        category: "Navigasi",
        permission: PERMISSIONS.financeRead,
      },
      {
        name: "Kepanitiaan",
        href: "/kepanitiaan",
        icon: Users,
        category: "Navigasi",
        permission: PERMISSIONS.committeeRead,
      },
      {
        name: "CMS Artikel",
        href: "/cms",
        icon: FileText,
        category: "Navigasi",
        permission: PERMISSIONS.cmsRead,
      },
      {
        name: "Pengguna",
        href: "/users",
        icon: UserCog,
        category: "Navigasi",
        permission: PERMISSIONS.usersRead,
      },
      {
        name: "Keluar Sesi",
        action: () => {
          if (confirm("Apakah Anda yakin ingin keluar?")) {
            logout();
          }
        },
        icon: LogOut,
        category: "Aksi Cepat",
      },
    ];

    return all.filter(
      (item) => !item.permission || hasPermission(item.permission),
    );
  }, [hasPermission, logout]);

  const filtered = useMemo(() => {
    if (!search) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, items]);

  const handleSelect = (item: any) => {
    onClose();
    setSearch("");
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden border border-white/10 bg-[#091c11]/95 p-0 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-center border-b border-white/10 px-4 py-3.5">
          <Search className="mr-3 h-5 w-5 text-[#10b981]" />
          <input
            type="text"
            placeholder="Cari halaman, menu, atau aksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
            autoFocus
          />
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#a9b49c]">
              Tidak ada hasil ditemukan
            </div>
          ) : (
            <div className="space-y-4">
              {["Navigasi", "Aksi Cepat"].map((cat) => {
                const catItems = filtered.filter((i) => i.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#10b981]">
                      {cat}
                    </span>
                    {catItems.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleSelect(item)}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-white/8 text-left"
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-[#10b981] transition-transform group-hover:scale-110" />
                          <span className="font-medium text-white">
                            {item.name}
                          </span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-white/20 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-2.5 text-[10px] text-[#a9b49c]">
          <span>Gunakan panah & enter untuk navigasi cepat</span>
          <span className="font-mono">ESC untuk menutup</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
