import { User } from '@/features/auth/types/auth.types';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  User as UserIcon,
  Megaphone,
  Shield,
  FileText,
  CheckSquare,
  FolderOpen,
  UserCheck,
  Layers,
  Settings,
  Key,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
  children?: NavItem[];
}

export const getNavItems = (user: User | null): NavItem[] => {
  if (!user) return [];

  const permissions: string[] = user.permissions || [];
  const isSuperAdmin =
    permissions.includes('manage:all') ||
    user.role === 'Super Admin' ||
    user.role === 'SUPER_ADMIN' ||
    (typeof user.role === 'object' && (user.role as { slug?: string })?.slug === 'super-admin');

  const has = (reqPerms?: string[]) => {
    if (!reqPerms || reqPerms.length === 0) return true;
    if (isSuperAdmin) return true;
    return reqPerms.some((p) => permissions.includes(p));
  };

  const allItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Monitoring & Ringkasan',
      icon: LayoutDashboard,
      requiredPermissions: ['pkkmb.monitoring.read'],
    },
    {
      href: '/dashboard/management/announcements',
      label: 'Pengumuman',
      icon: Megaphone,
      requiredPermissions: ['pkkmb.announcement.read', 'pkkmb.announcement.create'],
    },
    {
      href: '/dashboard/management/schedules',
      label: 'Jadwal Kegiatan',
      icon: Calendar,
      requiredPermissions: ['pkkmb.schedule.read', 'pkkmb.schedule.create'],
    },
    {
      href: '/dashboard/evaluator',
      label: 'Penilaian & Feedback',
      icon: ClipboardList,
      requiredPermissions: ['pkkmb.grading.read_all', 'pkkmb.grading.update', 'pkkmb.grading.create'],
    },
    {
      href: '/dashboard/tasks',
      label: 'Penugasan Saya',
      icon: ClipboardList,
      requiredPermissions: ['pkkmb.task.submit'],
    },
    {
      href: '/dashboard/group',
      label: 'Kelompok PKKMB',
      icon: Users,
      requiredPermissions: ['pkkmb.group.read_all', 'pkkmb.group.read_own'],
    },
    {
      href: '/dashboard/attendance',
      label: 'Presensi Kehadiran',
      icon: CheckSquare,
      requiredPermissions: ['pkkmb.attendance.read', 'pkkmb.attendance.checkin', 'pkkmb.profile.read_own'],
    },
    {
      href: '/dashboard/management/roles',
      label: 'Manajemen Role & Akses',
      icon: Shield,
      requiredPermissions: ['pkkmb.roles.read', 'pkkmb.roles.manage'],
    },
    {
      href: '/dashboard/management/audit-logs',
      label: 'Audit Log Sistem',
      icon: FileText,
      requiredPermissions: ['pkkmb.audit.read'],
    },
    {
      href: '/dashboard/profil',
      label: 'Profil Saya',
      icon: UserIcon,
      requiredPermissions: ['pkkmb.profile.read_own'],
    },
  ];

  // Filter items 100% based on permissions (Super Admin sees ALL items)
  return allItems.filter((item) => has(item.requiredPermissions));
};
