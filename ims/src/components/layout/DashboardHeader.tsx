import React from "react";
import Image from "next/image";
import { Menu, User, ChevronDown, Sun, Moon } from "lucide-react";
import { type UserProfileBase } from "@/types/rbac";

interface DashboardHeaderProps {
  profile: UserProfileBase | null;
  onOpenSidebar: () => void;
  onSwitchRole?: (assignmentId: string) => void;
}

export function DashboardHeader({ profile, onOpenSidebar, onSwitchRole }: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  const getRoleLabel = (role: string | { slug: string; name: string } | undefined) => {
    if (!role) return "Fungsionaris";
    const roleSlug = typeof role === 'string' ? role : role.slug;
    const roleName = typeof role === 'object' ? role.name : null;
    
    if (roleName) return roleName;

    switch (roleSlug) {
      case "super-admin": return "Super Administrator";
      case "ketua_bem": return "Ketua BEM FT";
      case "wakil_ketua_bem": return "Wakil Ketua BEM";
      case "admin": return "Admin Sistem";
      case "sekretaris": return "Sekretaris Umum";
      case "bendahara": return "Bendahara Umum";
      case "kadep": return "Kepala Departemen";
      case "wakadep": return "Wakil Kepala Dept";
      case "staf": return "Staf Fungsionaris";
      default: return "Fungsionaris";
    }
  };

  const getActiveRoleLabel = () => {
    if (!profile) return "Memuat...";
    if (profile.activeContext?.role?.name) return profile.activeContext.role.name;
    return getRoleLabel(profile.role as string);
  };

  return (
    <div className="w-full h-16 bg-canvas/80 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-semibold text-ink-muted hidden md:inline">
          Dashboard
        </h1>
      </div>

      {profile && (
        <div className="flex items-center gap-3 relative">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors mr-2 border border-transparent hover:border-hairline"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 text-left hover:bg-surface-2 p-1.5 rounded-lg transition-colors"
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-ink leading-tight">{profile.name}</span>
              <span className="text-xs text-ink-muted leading-none mt-0.5 flex items-center gap-1">
                {getActiveRoleLabel()}
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-surface-2 border border-hairline overflow-hidden flex items-center justify-center shrink-0 relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  sizes="32px"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-ink-muted" />
              )}
            </div>
          </button>

          {dropdownOpen && profile.assignments && profile.assignments.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-surface-1 border border-hairline rounded-xl p-2 z-50">
              <div className="text-xs font-semibold text-ink-tertiary px-3 py-2 uppercase tracking-wider">
                Ganti Role / Sesi
              </div>
              <div className="flex flex-col gap-1">
                {profile.assignments.map((assignment) => (
                  <button
                    key={assignment._id}
                    onClick={() => {
                      setDropdownOpen(false);
                      if (onSwitchRole) onSwitchRole(assignment._id);
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      profile.activeContext?.assignmentId === assignment._id
                        ? "bg-surface-3 text-ink font-medium"
                        : "hover:bg-surface-2 text-ink-muted"
                    }`}
                  >
                    <div className="font-semibold">{assignment.roleId?.name || "Role"}</div>
                    <div className="text-xs text-ink-tertiary">
                      Scope: {assignment.scopeType}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
