"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PERMISSIONS, type PermissionKey } from "@bemft/permissions";
import {
  LayoutDashboard,
  Calendar,
  KanbanSquare,
  Award,
  Mail,
  Wallet,
  Users,
  FileText,
  UserCog,
  LogOut,
  QrCode,
  Package,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  CheckSquare,
  FileCheck,
  Settings2,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Config-based hierarchical navigation
const navGroups = [
  {
    group: "Dasbor Utama",
    items: [
      {
        name: "Dasbor",
        href: "/",
        icon: LayoutDashboard,
        permission: PERMISSIONS.dashboardRead,
      },
      {
        name: "Kalender",
        href: "/kalender",
        icon: Calendar,
        permission: PERMISSIONS.prokerRead,
      },
    ],
  },
  {
    group: "Operasional",
    items: [
      {
        name: "Program Kerja",
        href: "/proker",
        icon: KanbanSquare,
        permission: PERMISSIONS.prokerRead,
      },
      {
        name: "Kepanitiaan",
        href: "/kepanitiaan",
        icon: Users,
        permission: PERMISSIONS.committeeRead,
      },
      {
        name: "Agenda Rapat",
        href: "/rapat",
        icon: QrCode,
        permission: PERMISSIONS.committeeRead,
      },
      {
        name: "Inventaris Aset",
        href: "/aset",
        icon: Package,
        permission: PERMISSIONS.committeeRead,
      },
    ],
  },
  {
    group: "Ruang Kerja",
    items: [
      {
        name: "Buku Panduan & SOP",
        href: "/panduan",
        icon: BookOpen,
        permission: PERMISSIONS.documentsRead,
      },
      {
        name: "Poin Penghargaan",
        href: "/penghargaan",
        icon: Award,
        permission: PERMISSIONS.prokerRead,
      },
      {
        name: "Persuratan",
        href: "/surat",
        icon: Mail,
        permission: PERMISSIONS.documentsRead,
      },
      {
        name: "Keuangan",
        href: "/keuangan",
        icon: Wallet,
        permission: PERMISSIONS.financeRead,
      },
    ],
  },
  {
    group: "Administrasi",
    items: [
      {
        name: "CMS Artikel",
        href: "/cms",
        icon: FileText,
        permission: PERMISSIONS.cmsRead,
      },
      {
        name: "Pengguna",
        href: "/pengguna",
        icon: UserCog,
        permission: PERMISSIONS.usersRead,
      },
      {
        name: "Manajemen Pengguna",
        href: "/admin/pengguna",
        icon: Settings2,
        permission: PERMISSIONS.usersManage,
      },
      {
        name: "Kebijakan Alur Kerja",
        href: "/admin/kebijakan",
        icon: ScrollText,
        permission: PERMISSIONS.workflowManage,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, hasPermission, activeRole } = useAuth();

  // Collapsible sections state
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({
    "Dasbor Utama": false,
    Operasional: false,
    "Ruang Kerja": false,
    Administrasi: false,
  });

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Determine if we are currently inside a specific workspace context (e.g. committee details)
  const isCommitteeContext = useMemo(() => {
    return pathname.startsWith("/kepanitiaan/") && pathname !== "/kepanitiaan";
  }, [pathname]);

  const committeeId = useMemo(() => {
    if (!isCommitteeContext) return null;
    const parts = pathname.split("/");
    return parts[2]; // /kepanitiaan/[id]
  }, [pathname, isCommitteeContext]);

  return (
    <div className="flex h-screen w-72 flex-col border-r border-white/10 bg-[#091c11]/85 shadow-[24px_0_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
          <Image
            src="/logobemft.png"
            alt="BEM FT"
            width={30}
            height={30}
            className="object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-black tracking-wide text-white">
            IMS BEM FT
          </span>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-[#10b981]">
            DANADYAKSA ERP
          </span>
        </div>
      </div>

      {/* Navigation Groups Container */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {/* Context-Aware Workspace Menu (Dynamic Sidebar) */}
        {isCommitteeContext && (
          <div className="mx-3 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[#a7f3d0]">
              <Layers className="h-3.5 w-3.5 text-[#10b981]" />
              Ruang Kerja Panitia
            </div>
            <div className="mt-2 space-y-1">
              <Link
                href={`/kepanitiaan/${committeeId}`}
                className={cn(
                  "flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  pathname === `/kepanitiaan/${committeeId}`
                    ? "bg-[#10b981]/20 text-white"
                    : "text-[#b8c4aa] hover:bg-white/5 hover:text-white",
                )}
              >
                <Users className="mr-2 h-3.5 w-3.5 text-[#10b981]" />
                Fungsionaris
              </Link>
              <Link
                href={`/kepanitiaan/${committeeId}/tasks`}
                className={cn(
                  "flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  pathname.includes("/tasks")
                    ? "bg-[#10b981]/20 text-white"
                    : "text-[#b8c4aa] hover:bg-white/5 hover:text-white",
                )}
              >
                <CheckSquare className="mr-2 h-3.5 w-3.5 text-[#10b981]" />
                Tugas & Agenda
              </Link>
              <Link
                href={`/kepanitiaan/${committeeId}/lpj`}
                className={cn(
                  "flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  pathname.includes("/lpj")
                    ? "bg-[#10b981]/20 text-white"
                    : "text-[#b8c4aa] hover:bg-white/5 hover:text-white",
                )}
              >
                <FileCheck className="mr-2 h-3.5 w-3.5 text-[#10b981]" />
                Proposal & LPJ
              </Link>
            </div>
          </div>
        )}

        {/* Standard Config-based Groups */}
        <nav className="space-y-4 px-3">
          {navGroups.map((group) => {
            // Filter group items by permissions
            const visibleItems = group.items.filter((item) =>
              hasPermission(item.permission),
            );

            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedGroups[group.group];

            return (
              <div key={group.group} className="space-y-1">
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex w-full items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-[#10b981] hover:text-white transition-colors"
                >
                  <span>{group.group}</span>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="mt-1 space-y-0.5 transition-all">
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "group flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                            isActive
                              ? "border border-[#10b981]/20 bg-white/10 text-white shadow-[0_0_24px_rgba(16, 185, 129,0.08)]"
                              : "border border-transparent text-[#b8c4aa] hover:border-white/5 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "mr-3 h-4.5 w-4.5 shrink-0 transition-colors",
                              isActive
                                ? "text-[#a7f3d0]"
                                : "text-[#10b981] group-hover:text-[#a7f3d0]",
                            )}
                            aria-hidden="true"
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Verified Access Badge & Session Footer */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="rounded-lg border border-white/8 bg-white/5 p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-[#10b981]" />
            Akses Aktif
          </div>
          <div className="text-[10px] text-[#a9b49c] font-medium truncate uppercase">
            {activeRole || "Fungsionaris BEM"}
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-xs font-semibold text-[#b8c4aa] hover:bg-[#ff7a7a]/8 hover:text-[#ff9b9b]"
          onClick={() => {
            if (confirm("Apakah Anda yakin ingin keluar?")) {
              logout();
            }
          }}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Keluar Sesi
        </Button>
      </div>
    </div>
  );
}
