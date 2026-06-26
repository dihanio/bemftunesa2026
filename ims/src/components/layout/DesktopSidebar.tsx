import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  LogOut, LayoutDashboard, FileText, DollarSign, CalendarCheck, Package, 
  Settings, Users, CheckSquare, Send, Briefcase, Megaphone, BarChart,
  FileSearch, Archive, Copy, Calendar, Edit3, CheckCircle, CreditCard,
  FileClock, FileCheck, PieChart, Book, Activity, List, Building2, Award
} from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarSection } from "../../config/sidebar-registry";

interface DesktopSidebarProps {
  sections: SidebarSection[];
  onLogout: () => void;
  roleName?: string;
}

const iconMap: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  'calendar-check': CalendarCheck,
  'package': Package,
  'settings': Settings,
  'users': Users,
  'check-square': CheckSquare,
  'send': Send,
  'briefcase': Briefcase,
  'megaphone': Megaphone,
  'bar-chart': BarChart,
  'file-search': FileSearch,
  'archive': Archive,
  'copy': Copy,
  'calendar': Calendar,
  'edit-3': Edit3,
  'check-circle': CheckCircle,
  'credit-card': CreditCard,
  'file-clock': FileClock,
  'file-check': FileCheck,
  'pie-chart': PieChart,
  'book': Book,
  'activity': Activity,
  'list': List,
  'building-2': Building2,
  'award': Award,
  'file': FileText,
  'file-type': FileText,
  'hash': FileText,
  'git-merge': FileText,
};

export function DesktopSidebar({ sections, onLogout, roleName }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 glass-subtle border-t-0 border-b-0 border-l-0 rounded-none border-r border-sage/10 shrink-0 justify-between py-6 z-20 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-6">
        {/* Logo Section */}
        <div className="px-6 flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Image src="/images/logo-bemft.png" alt="Logo BEM FT" width={36} height={36} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-bold text-sm leading-none mb-0.5">IMS Dashboard</span>
            <span className="text-xs text-foreground/50 leading-none">BEM FT UNESA</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-6 px-4">
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-1">
              <div className="px-4 mb-1 text-[10px] font-bold tracking-wider text-foreground/40">
                {section.label}
              </div>
              
              {section.items.map((item, index) => {
                const isActive = item.status === "active" && (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path));
                const Icon = iconMap[item.icon] || LayoutDashboard;
                
                return (
                  <div key={index}>
                    {item.status === "locked" ? (
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl text-foreground/30 text-sm select-none">
                        <span className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </span>
                        <span className="text-[10px] font-medium text-foreground/25 bg-white/5 px-2 py-0.5 rounded-md">
                          {item.phase}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border ${
                          isActive
                            ? "bg-sage/10 border-sage/20 text-sage font-bold"
                            : "border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </div>
                        {/* Add badge support here if needed in the future */}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
