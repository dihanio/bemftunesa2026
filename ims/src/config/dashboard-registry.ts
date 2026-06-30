import { DashboardConfig } from '../types/role-types';

export const dashboardRegistry: Record<string, DashboardConfig> = {
  kabem: {
    roleSlug: 'kabem',
    roleName: 'Ketua BEM',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Selamat bertugas, Ketua.',
    kpis: [
      { id: 'proker_aktif', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
      { id: 'surat_ttd', label: 'Surat Menunggu TTD', valueKey: 'pendingSignatures', icon: 'file-signature', color: 'accent-gold' },
    ],
    widgets: [
      { id: 'exec_summary', component: 'ExecutiveSummary', size: 'full' },
      { id: 'kalender_agenda', component: 'AgendaCalendar', size: 'medium' },
      { id: 'persetujuan_prioritas', component: 'ApprovalQueue', size: 'full', props: { priorityOnly: true } },
    ],
    quickActions: [
      { id: 'approve_surat', label: 'Approve Surat', icon: 'check-circle', href: '/surat', color: 'primary' },
    ],
    notificationPriority: [
      { type: 'surat_ttd', level: 'high' },
    ],
  },
  
  sekretaris: {
    roleSlug: 'sekretaris',
    roleName: 'Sekretaris Umum',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Selamat mengelola administrasi.',
    kpis: [
      { id: 'draft_review', label: 'Draft Menunggu Review', valueKey: 'pendingDrafts', icon: 'file-search', color: 'accent-gold' },
    ],
    widgets: [
      { id: 'approval_persuratan', component: 'ApprovalQueue', size: 'full', props: { type: 'surat' } },
      { id: 'nomor_surat', component: 'CorrespondenceWidget', size: 'medium' },
    ],
    quickActions: [
      { id: 'buat_surat', label: 'Buat Surat Baru', icon: 'plus', href: '/surat/new', color: 'primary' },
    ],
    notificationPriority: [
      { type: 'draft_surat_baru', level: 'high' },
      { type: 'revisi_surat', level: 'high' },
    ],
  },

  bendahara: {
    roleSlug: 'bendahara',
    roleName: 'Bendahara Umum',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Selamat bertugas, Bendahara.',
    kpis: [
      { id: 'proker_aktif', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
    ],
    widgets: [
      { id: 'kalender_agenda', component: 'AgendaCalendar', size: 'full' },
    ],
    quickActions: [
      { id: 'buat_surat', label: 'Buat Surat Baru', icon: 'plus', href: '/surat/new', color: 'primary' },
    ],
    notificationPriority: [],
  },

  'super-admin': {
    roleSlug: 'super-admin',
    roleName: 'Super Administrator',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Sistem berjalan normal.',
    kpis: [
      { id: 'active_users', label: 'Total Anggota', valueKey: 'total_members', icon: 'users', color: 'accent-blue' },
      { id: 'total_proker', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
    ],
    widgets: [
      { id: 'kalender_agenda', component: 'AgendaCalendar', size: 'full' },
    ],
    quickActions: [
      { id: 'kelola_user', label: 'Kelola User', icon: 'user-cog', href: '/settings/users', color: 'primary' },
      { id: 'kelola_role', label: 'Kelola Role', icon: 'shield', href: '/settings/roles', color: 'secondary' },
    ],
    notificationPriority: [],
  },
  
  kadep: {
    roleSlug: 'kadep',
    roleName: 'Kepala Departemen',
    scope: 'department',
    defaultPage: '/',
    greeting: 'Pantau kinerja departemen Anda.',
    kpis: [
      { id: 'proker_jalan', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
    ],
    widgets: [
      { id: 'progres_dept', component: 'DepartmentProgress', size: 'full' },
      { id: 'kalender_dept', component: 'AgendaCalendar', size: 'medium' },
      { id: 'persetujuan_dept', component: 'ApprovalQueue', size: 'medium' },
    ],
    quickActions: [
      { id: 'rapat_kordinasi', label: 'Buat Rapat Baru', icon: 'calendar-check', href: '/rapat/new', color: 'primary' },
    ],
    notificationPriority: [],
  },

  ketua_panitia: {
    roleSlug: 'ketua_panitia',
    roleName: 'Ketua Pelaksana',
    scope: 'committee',
    defaultPage: '/',
    greeting: 'Pantau kesiapan program kerja.',
    kpis: [
      { id: 'proker_aktif', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
    ],
    widgets: [
      { id: 'kalender_agenda', component: 'AgendaCalendar', size: 'full' },
    ],
    quickActions: [
      { id: 'buat_surat', label: 'Buat Surat Baru', icon: 'plus', href: '/surat/new', color: 'primary' },
    ],
    notificationPriority: [],
  },

  staf: {
    roleSlug: 'staf',
    roleName: 'Staf',
    scope: 'department',
    defaultPage: '/',
    greeting: 'Selamat bekerja.',
    kpis: [
      { id: 'proker_aktif', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
    ],
    widgets: [
      { id: 'agenda_calendar', component: 'AgendaCalendar', size: 'full' },
    ],
    quickActions: [
      { id: 'buat_surat', label: 'Buat Surat Baru', icon: 'plus', href: '/surat/new', color: 'primary' },
    ],
    notificationPriority: [],
  },
  user: {
    roleSlug: 'user',
    roleName: 'Anggota / User',
    scope: 'department',
    defaultPage: '/',
    greeting: 'Selamat datang di sistem.',
    kpis: [
      { id: 'proker_aktif', label: 'Total Program Kerja', valueKey: 'total_proker', icon: 'briefcase', color: 'sage' },
    ],
    widgets: [
      { id: 'agenda_calendar', component: 'AgendaCalendar', size: 'full' },
    ],
    quickActions: [
      { id: 'buat_surat', label: 'Buat Surat Baru', icon: 'plus', href: '/surat/new', color: 'primary' },
    ],
    notificationPriority: [],
  }
};

export const getDashboardConfig = (roleSlug: string): DashboardConfig => {
  return dashboardRegistry[roleSlug] || dashboardRegistry['staf'];
};
