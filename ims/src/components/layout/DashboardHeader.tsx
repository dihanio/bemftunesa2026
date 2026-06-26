import React from "react";
import Image from "next/image";
import { Menu, User, ChevronDown } from "lucide-react";
import { type UserProfile, type RoleAssignment } from "@/lib/api";

interface DashboardHeaderProps {
  profile: UserProfile | null;
  onOpenSidebar: () => void;
  onSwitchRole?: (assignmentId: string) => void;
}

export function DashboardHeader({ profile, onOpenSidebar, onSwitchRole }: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

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
    return getRoleLabel(profile.role as any);
  };

  return (
    <header className="h-16 border-b border-sage/10 glass-subtle border-t-0 border-l-0 border-r-0 rounded-none px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-foreground"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-semibold text-foreground/80 hidden md:inline">
          Dashboard
        </h1>
      </div>

      {profile && (
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 text-left hover:bg-white/5 p-1.5 rounded-lg transition-colors"
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-foreground leading-tight">{profile.name}</span>
              <span className="text-xs text-sage leading-none mt-0.5 flex items-center gap-1">
                {getActiveRoleLabel()}
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-sage/10 border border-sage/20 overflow-hidden flex items-center justify-center shrink-0 relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-sage" />
              )}
            </div>
          </button>

          {dropdownOpen && profile.assignments && profile.assignments.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-background border border-sage/20 rounded-xl shadow-lg p-2 z-50">
              <div className="text-xs font-semibold text-foreground/50 px-3 py-2 uppercase tracking-wider">
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
                        ? "bg-sage/10 text-sage font-medium"
                        : "hover:bg-white/5 text-foreground/80"
                    }`}
                  >
                    <div className="font-semibold">{assignment.roleId?.name || "Role"}</div>
                    <div className="text-xs opacity-70">
                      Scope: {assignment.scopeType}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
