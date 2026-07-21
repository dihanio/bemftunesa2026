import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  LogOut, X, LayoutDashboard, FileText, DollarSign, CalendarCheck, Package, 
  Settings, Users, CheckSquare, Send, Briefcase, Megaphone, BarChart,
  FileSearch, Archive, Copy, Calendar, Edit3, CheckCircle, CreditCard,
  FileClock, FileCheck, PieChart, Book, Activity, List, Building2, Award,
  Mail, Newspaper, MessageSquare, Handshake, Image as ImageIcon, UserPlus, Target, FolderOpen, Network, Sliders
} from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarSection } from "../../types/role-types";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SidebarSection[];
  onLogout: () => void;
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

export function MobileSidebar({ isOpen, onClose, sections, onLogout }: MobileSidebarProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden flex">
      <aside className="w-64 h-full glass-active border-t-0 border-l-0 border-b-0 border-r border-sage/10 flex flex-col justify-between py-4 animate-in slide-in-from-left duration-300 overflow-hidden">
        
        {/* Header & Logo (Fixed) */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 px-6 shrink-0 mb-4 mt-2">
          <div className="flex items-center gap-2.5">
              <Image src="/images/logo-bemft.png" alt="Logo BEM FT" width={24} height={24} className="object-contain" />
              <span className="text-sm font-bold text-foreground">IMS Dashboard</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/5 text-foreground/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Navigation Sections (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 px-4 pb-4">
          {sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-1">
                <div className="px-3 mb-1 text-[10px] font-bold tracking-wider text-foreground/40">
                  {section.label}
                </div>
                
                {section.items.map((item, index) => {
                  const isActive = item.status === "active" && (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path));
                  const Icon = iconMap[item.icon] || LayoutDashboard;
                  
                  return (
                    <div key={index}>
                      {item.status === "locked" ? (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-foreground/30 text-sm select-none">
                          <span className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            {item.name}
                          </span>
                          <span className="text-[10px] text-foreground/25 bg-white/5 px-1.5 py-0.5 rounded">
                            {item.phase}
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                            isActive
                              ? "bg-sage/10 border-sage/20 text-sage font-semibold"
                              : "border-transparent text-foreground/60 hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.name}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        {/* Logout (Fixed Bottom) */}
        <div className="px-4 pt-4 border-t border-white/5 shrink-0 mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 p-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </aside>
      
      {/* Overlay Click closer */}
      <div className="flex-grow" onClick={onClose} />
    </div>
  );
}
