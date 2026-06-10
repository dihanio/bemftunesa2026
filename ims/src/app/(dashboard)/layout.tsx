"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { isAuthenticated, _hasHydrated, hasPermission, user, activeRole } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Register Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    console.log("[DashboardLayout] Auth State:", {
      isAuthenticated,
      _hasHydrated,
    });

    if (_hasHydrated && !isAuthenticated) {
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          console.warn(
            "[DashboardLayout] Not authenticated, redirecting to /login",
          );
          router.replace("/login");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // Route permission intercept guards
  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;

    const currentRole = activeRole || user?.role;
    const isSystemAdmin =
      currentRole === "Admin Sistem" ||
      currentRole === "System Administrator" ||
      currentRole === "Super Admin";

    if (isSystemAdmin) return;

    const routePermissions = [
      { path: "/admin/users", permission: "users.manage" },
      { path: "/admin/policies", permission: "workflow.manage" },
      { path: "/workload", permission: "users.read" },
      { path: "/surat", permission: "documents.read" },
      { path: "/finance", permission: "finance.read" },
      { path: "/cms", permission: "cms.read" },
      { path: "/proker", permission: "proker.read" },
      { path: "/kepanitiaan", permission: "committee.read" },
      { path: "/assets", permission: "committee.read" },
      { path: "/meetings", permission: "committee.read" },
      { path: "/wiki", permission: "documents.read" },
      { path: "/reward", permission: "proker.read" },
    ];

    const matchingGuard = routePermissions.find((g) =>
      pathname.startsWith(g.path),
    );
    if (matchingGuard && !hasPermission(matchingGuard.permission as any)) {
      console.warn(
        `[RouteGuard] Access denied for path ${pathname}, redirecting to /403`,
      );
      router.replace("/403");
    }
  }, [pathname, isAuthenticated, _hasHydrated, hasPermission, user, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#091c11]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#10b981] border-r-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: "url('/ft_unesa.webp')" }}
      />
      <div className="pointer-events-none fixed inset-0 bg-linear-to-b from-[#12331e]/95 via-[#0d2516]/96 to-[#091c11]" />

      {/* Ambient Glow Orbs */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-accent/15 blur-[120px] mix-blend-screen animate-pulse duration-8000" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#71d39b]/10 blur-[150px] mix-blend-screen animate-pulse duration-10000" />
      <div className="pointer-events-none fixed top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-[#f0c36a]/5 blur-[100px] mix-blend-screen animate-pulse duration-12000" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onSearchClick={() => setCommandPaletteOpen(true)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
