export interface NavItemConfig {
  id: string;
  title: string;
  route: string;
  iconName: 'LayoutDashboard' | 'Megaphone' | 'Calendar' | 'ClipboardList' | 'Users' | 'UserCheck' | 'Shield' | 'FileCode' | 'CheckSquare';
  requiredPermissions: string[];
}

export const MAIN_NAVIGATION: NavItemConfig[] = [
  {
    id: 'monitoring',
    title: 'Monitoring & Ringkasan',
    route: '/dashboard',
    iconName: 'LayoutDashboard',
    requiredPermissions: ['pkkmb.monitoring.read'],
  },
  {
    id: 'announcements',
    title: 'Manajemen Pengumuman',
    route: '/dashboard/management/announcements',
    iconName: 'Megaphone',
    requiredPermissions: ['pkkmb.announcement.read'],
  },
  {
    id: 'schedules',
    title: 'Manajemen Jadwal',
    route: '/dashboard/management/schedules',
    iconName: 'Calendar',
    requiredPermissions: ['pkkmb.schedule.read'],
  },
  {
    id: 'evaluator',
    title: 'Penilaian & Feedback',
    route: '/dashboard/evaluator',
    iconName: 'ClipboardList',
    requiredPermissions: ['pkkmb.grading.read_all', 'pkkmb.grading.update', 'pkkmb.grading.create'],
  },
  {
    id: 'group',
    title: 'Kelompok PKKMB',
    route: '/dashboard/group',
    iconName: 'Users',
    requiredPermissions: ['pkkmb.group.read_all', 'pkkmb.group.read_own'],
  },
  {
    id: 'attendance',
    title: 'Presensi Kehadiran',
    route: '/dashboard/attendance',
    iconName: 'CheckSquare',
    requiredPermissions: ['pkkmb.attendance.read', 'pkkmb.attendance.checkin', 'pkkmb.profile.read_own'],
  },
  {
    id: 'maba_tasks',
    title: 'Penugasan Saya',
    route: '/dashboard/tasks',
    iconName: 'ClipboardList',
    requiredPermissions: ['pkkmb.task.submit'],
  },
  {
    id: 'roles_management',
    title: 'Manajemen Role & Akses',
    route: '/dashboard/management/roles',
    iconName: 'Shield',
    requiredPermissions: ['pkkmb.roles.read', 'pkkmb.roles.manage'],
  },
  {
    id: 'audit_logs',
    title: 'Audit Log Sistem',
    route: '/dashboard/management/audit-logs',
    iconName: 'FileCode',
    requiredPermissions: ['pkkmb.audit.read'],
  },
];
