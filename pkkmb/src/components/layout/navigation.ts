import { User } from '@/features/auth/types/auth.types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  User as UserIcon,
  Settings,
  ShieldAlert,
  Info,
  Megaphone,
  type LucideIcon,
  CheckSquare
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[]; // If undefined, accessible to all logged-in users
  children?: NavItem[];
}

export const getNavItems = (user: User | null): NavItem[] => {
  if (!user) return [];

  const items: NavItem[] = [];

  // Maba
  if (user.role === 'MABA') {
    items.push(
      { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
      { 
        href: '/dashboard/informasi', 
        label: 'Informasi', 
        icon: Info,
        children: [
          { href: '/dashboard/informasi', label: 'Pengumuman', icon: Megaphone },
          { href: '/dashboard/informasi?tab=jadwal', label: 'Jadwal', icon: Calendar },
        ]
      },
      { href: '/dashboard/tasks', label: 'Tugas', icon: ClipboardList },
      { href: '/dashboard/attendance', label: 'Absensi', icon: CheckSquare },
      { href: '/dashboard/profil', label: 'Profil', icon: UserIcon },
    );
  }

  // Panitia
  if (user.role === 'PANITIA') {
    items.push(
      { href: '/dashboard', label: 'Monitoring', icon: LayoutDashboard },
      { 
        href: '/dashboard/management', 
        label: 'Manajemen', 
        icon: Settings,
        children: [
          { href: '/dashboard/management/announcements', label: 'Pengumuman', icon: Megaphone },
          { href: '/dashboard/management/schedules', label: 'Jadwal', icon: Calendar },
        ]
      },
      { href: '/dashboard/evaluator', label: 'Penilaian', icon: ClipboardList },
      { href: '/dashboard/group', label: 'Mentoring', icon: Users },
      { href: '/dashboard/profil', label: 'Profil', icon: UserIcon },
    );
  }

  // Admin
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    items.push(
      { href: '/admin', label: 'Admin Panel', icon: ShieldAlert },
    );
  }

  return items;
};
