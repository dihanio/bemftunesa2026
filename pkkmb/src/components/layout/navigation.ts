import { User } from '@/features/auth/types/auth.types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  User as UserIcon,
  Settings,
  ShieldAlert,
  type LucideIcon
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[]; // If undefined, accessible to all logged-in users
}

export const getNavItems = (user: User | null): NavItem[] => {
  if (!user) return [];

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  // Role-based navigation additions
  if (user.role === 'MABA') {
    items.push(
      { href: '/dashboard/group', label: 'Grup Saya', icon: Users },
      { href: '/dashboard/tasks', label: 'Tugas', icon: ClipboardList },
      { href: '/dashboard/schedule', label: 'Jadwal', icon: Calendar },
    );
  }

  if (user.role === 'PANITIA') {
    items.push(
      { href: '/dashboard/group', label: 'Mentoring', icon: Users },
      { href: '/dashboard/evaluator', label: 'Penilaian', icon: ClipboardList },
      { href: '/dashboard/schedule', label: 'Jadwal', icon: Calendar },
    );
  }

  if (user.role === 'ADMIN') {
    items.push(
      { href: '/admin', label: 'Admin Panel', icon: ShieldAlert },
    );
  }

  // Common trailing items
  items.push(
    { href: '/dashboard/profil', label: 'Profil', icon: UserIcon },
    { href: '/dashboard/informasi', label: 'Informasi', icon: Settings }
  );

  return items;
};
