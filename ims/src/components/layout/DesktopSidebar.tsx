import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  LogOut, LayoutDashboard, FileText, DollarSign, CalendarCheck, Package, 
  Settings, Users, CheckSquare, Send, Briefcase, Megaphone, BarChart,
  FileSearch, Archive, Copy, Calendar, Edit3, CheckCircle, CreditCard,
  FileClock, FileCheck, PieChart, Book, Activity, List, Building2, Award,
  Mail, Newspaper, MessageSquare, Handshake, Image as ImageIcon, UserPlus, Target, FolderOpen, Network, Sliders
} from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarSection } from "../../types/role-types";

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
  'mail': Mail,
  'newspaper': Newspaper,
  'message-square': MessageSquare,
  'handshake': Handshake,
  'image': ImageIcon,
  'user-plus': UserPlus,
  'target': Target,
  'folder-open': FolderOpen,
  'network': Network,
  'sliders': Sliders,
};

export function DesktopSidebar({ sections, onLogout, roleName }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-canvas border-t-0 border-b-0 border-l-0 rounded-none border-r border-hairline shrink-0 justify-between py-4 z-20 overflow-hidden">
      
      {/* Logo Section (Fixed) */}
      <div className="px-6 flex items-center gap-3 mb-6 shrink-0 mt-2">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Image src="/images/logo-bemft.png" alt="Logo BEM FT" width={36} height={36} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-ink font-medium text-sm leading-none mb-0.5">IMS Dashboard</span>
            <span className="text-xs text-ink-subtle leading-none">BEM FT UNESA</span>
          </div>
        </div>

        {/* Navigation Sections (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 px-4 pb-4">
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-1">
              <div className="px-4 mb-1 text-[10px] font-medium tracking-wider text-ink-tertiary">
                {section.label}
              </div>
              
              {section.items.map((item, index) => {
                const isActive = item.status === "active" && (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path));
                const Icon = iconMap[item.icon] || LayoutDashboard;
                
                return (
                  <div key={index}>
                    {item.status === "locked" ? (
                      <div className="flex items-center justify-between px-4 py-2 rounded-xl text-ink-subtle text-sm select-none">
                        <span className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </span>
                        <span className="text-[10px] font-medium text-ink-tertiary bg-surface-2 px-2 py-0.5 rounded-md">
                          {item.phase}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-all duration-150 border ${
                          isActive
                            ? "bg-surface-2 border-hairline-strong text-ink font-medium"
                            : "border-transparent text-ink-muted hover:text-ink hover:bg-surface-2"
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

      {/* Logout (Fixed Bottom) */}
      <div className="px-4 pt-4 border-t border-hairline shrink-0 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface-2 hover:text-ink transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
