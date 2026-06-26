import { DashboardConfig } from '../types/role-types';

export const dashboardRegistry: Record<string, DashboardConfig> = {
  kabem: {
    roleSlug: 'kabem',
    roleName: 'Ketua BEM',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Selamat bertugas, Ketua.',
    kpis: [
      { id: 'proker_aktif', label: 'Proker Aktif', valueKey: 'activeProker', icon: 'briefcase', color: 'sage' },
      { id: 'proker_bermasalah', label: 'Proker Bermasalah', valueKey: 'problematicProker', icon: 'alert-triangle', color: 'rose' },
      { id: 'surat_ttd', label: 'Surat Menunggu TTD', valueKey: 'pendingSignatures', icon: 'file-signature', color: 'accent-gold' },
      { id: 'rab_pending', label: 'RAB Pending', valueKey: 'pendingRab', icon: 'dollar-sign', color: 'accent-blue' },
      { id: 'aspirasi_belum', label: 'Aspirasi Belum Selesai', valueKey: 'unresolvedAspirations', icon: 'message-square', color: 'rose' },
      { id: 'persentase_proker', label: 'Ketercapaian Program', valueKey: 'prokerCompletion', trendKey: 'prokerTrend', trendDirection: 'up', icon: 'trending-up', color: 'sage' },
    ],
    widgets: [
      { id: 'exec_summary', component: 'ExecutiveSummary', size: 'full' },
      { id: 'kalender_agenda', component: 'AgendaCalendar', size: 'medium' },
      { id: 'proker_terlambat', component: 'ProkerTerlambat', size: 'medium' },
      { id: 'persetujuan_prioritas', component: 'ApprovalQueue', size: 'full', props: { priorityOnly: true } },
      { id: 'ringkasan_keuangan', component: 'FinancialSummary', size: 'medium' },
      { id: 'aspirasi_mendesak', component: 'UrgentAspirations', size: 'medium' },
    ],
    quickActions: [
      { id: 'approve_surat', label: 'Approve Surat', icon: 'check-circle', href: '/surat?tab=approval', color: 'primary' },
      { id: 'approve_rab', label: 'Approve RAB', icon: 'dollar-sign', href: '/keuangan?tab=rab_approval', color: 'primary' },
      { id: 'broadcast', label: 'Broadcast Pengumuman', icon: 'megaphone', action: 'open_broadcast_modal', color: 'secondary' },
      { id: 'disposisi', label: 'Buat Disposisi', icon: 'send', action: 'open_disposisi_modal', color: 'secondary' },
    ],
    notificationPriority: [
      { type: 'surat_ttd', level: 'high' },
      { type: 'rab_approval', level: 'high' },
      { type: 'proker_terlambat', level: 'medium' },
      { type: 'aspirasi_baru', level: 'medium' },
    ],
  },
  
  sekretaris: {
    roleSlug: 'sekretaris',
    roleName: 'Sekretaris Umum',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Selamat mengelola administrasi.',
    kpis: [
      { id: 'surat_masuk', label: 'Surat Masuk', valueKey: 'incomingMail', icon: 'inbox', color: 'accent-blue' },
      { id: 'surat_keluar', label: 'Surat Keluar', valueKey: 'outgoingMail', icon: 'send', color: 'sage' },
      { id: 'draft_review', label: 'Draft Menunggu Review', valueKey: 'pendingDrafts', icon: 'file-search', color: 'accent-gold' },
      { id: 'arsip_bulan', label: 'Arsip Bulan Ini', valueKey: 'monthlyArchives', icon: 'archive', color: 'default' },
    ],
    widgets: [
      { id: 'approval_persuratan', component: 'ApprovalQueue', size: 'full', props: { type: 'surat' } },
      { id: 'nomor_surat', component: 'CorrespondenceWidget', size: 'medium' },
      { id: 'template_surat', component: 'TemplateSurat', size: 'medium' },
      { id: 'jadwal_rapat', component: 'JadwalRapat', size: 'full' },
    ],
    quickActions: [
      { id: 'buat_surat', label: 'Buat Surat', icon: 'plus', href: '/surat/new', color: 'primary' },
      { id: 'review_surat', label: 'Review Surat', icon: 'file-search', href: '/surat?tab=review', color: 'warning' },
      { id: 'arsipkan_surat', label: 'Arsipkan Surat', icon: 'archive', action: 'open_archive_modal', color: 'secondary' },
    ],
    notificationPriority: [
      { type: 'draft_surat_baru', level: 'high' },
      { type: 'revisi_surat', level: 'high' },
      { type: 'surat_masuk_baru', level: 'medium' },
    ],
  },

  bendahara: {
    roleSlug: 'bendahara',
    roleName: 'Bendahara Umum',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Pantau arus kas organisasi.',
    kpis: [
      { id: 'saldo', label: 'Saldo Organisasi', valueKey: 'totalBalance', icon: 'wallet', color: 'sage' },
      { id: 'pengeluaran', label: 'Pengeluaran Bulan Ini', valueKey: 'monthlyExpenses', icon: 'trending-down', color: 'rose' },
      { id: 'pemasukan', label: 'Pemasukan Bulan Ini', valueKey: 'monthlyIncome', icon: 'trending-up', color: 'sage' },
      { id: 'rab_pending', label: 'RAB Pending', valueKey: 'pendingRab', icon: 'file-clock', color: 'accent-gold' },
      { id: 'spj_pending', label: 'SPJ Pending', valueKey: 'pendingSpj', icon: 'file-text', color: 'accent-gold' },
      { id: 'lpj_pending', label: 'LPJ Pending', valueKey: 'pendingLpj', icon: 'file-check', color: 'accent-blue' },
    ],
    widgets: [
      { id: 'cashflow_chart', component: 'CashflowChart', size: 'full' },
      { id: 'approval_keuangan', component: 'ApprovalQueue', size: 'full', props: { type: 'keuangan' } },
      { id: 'anggaran_dept', component: 'AnggaranDepartemen', size: 'medium' },
      { id: 'pengeluaran_terbesar', component: 'PengeluaranTerbesar', size: 'medium' },
    ],
    quickActions: [
      { id: 'review_rab', label: 'Review RAB', icon: 'file-search', href: '/keuangan?tab=rab', color: 'primary' },
      { id: 'verifikasi_spj', label: 'Verifikasi SPJ', icon: 'check-square', href: '/keuangan?tab=spj', color: 'warning' },
      { id: 'verifikasi_lpj', label: 'Verifikasi LPJ', icon: 'check-circle', href: '/keuangan?tab=lpj', color: 'warning' },
    ],
    notificationPriority: [
      { type: 'rab_baru', level: 'high' },
      { type: 'spj_baru', level: 'high' },
      { type: 'lpj_baru', level: 'high' },
      { type: 'dana_cair', level: 'medium' },
    ],
  },

  'super-admin': {
    roleSlug: 'super-admin',
    roleName: 'Super Administrator',
    scope: 'global',
    defaultPage: '/',
    greeting: 'Sistem berjalan normal.',
    kpis: [
      { id: 'active_users', label: 'Active Users', valueKey: 'activeUsers', icon: 'users', color: 'accent-blue' },
      { id: 'error_rate', label: 'Error Rate', valueKey: 'errorRate', trendKey: 'errorTrend', trendDirection: 'down', icon: 'alert-triangle', color: 'rose' },
      { id: 'cpu_usage', label: 'CPU Usage', valueKey: 'cpuUsage', icon: 'cpu', color: 'sage' },
      { id: 'mem_usage', label: 'Memory Usage', valueKey: 'memoryUsage', icon: 'database', color: 'sage' },
      { id: 'db_size', label: 'Database Size', valueKey: 'dbSize', icon: 'hard-drive', color: 'default' },
    ],
    widgets: [
      { id: 'server_monitor', component: 'SystemMonitor', size: 'medium', props: { type: 'server' } },
      { id: 'api_monitor', component: 'SystemMonitor', size: 'medium', props: { type: 'api' } },
      { id: 'security_alerts', component: 'SecurityAlerts', size: 'full' },
      { id: 'login_activity', component: 'LoginActivity', size: 'full' },
    ],
    quickActions: [
      { id: 'kelola_user', label: 'Kelola User', icon: 'user-cog', href: '/settings/users', color: 'primary' },
      { id: 'kelola_role', label: 'Kelola Role', icon: 'shield', href: '/settings/roles', color: 'secondary' },
      { id: 'kelola_sistem', label: 'Kelola Sistem', icon: 'settings', href: '/settings/system', color: 'secondary' },
    ],
    notificationPriority: [
      { type: 'system_error', level: 'high' },
      { type: 'security_alert', level: 'high' },
      { type: 'high_cpu', level: 'medium' },
    ],
  },
  
  kadep: {
    roleSlug: 'kadep',
    roleName: 'Kepala Departemen',
    scope: 'department',
    defaultPage: '/',
    greeting: 'Pantau kinerja departemen Anda.',
    kpis: [
      { id: 'proker_jalan', label: 'Proker Berjalan', valueKey: 'activeProker', icon: 'briefcase', color: 'sage' },
      { id: 'anggaran_terserap', label: 'AnggaranTerserap', valueKey: 'budgetUsed', icon: 'dollar-sign', color: 'accent-blue' },
      { id: 'staff_aktif', label: 'Staf Aktif', valueKey: 'activeStaff', icon: 'users', color: 'sage' },
      { id: 'tugas_tertunda', label: 'Tugas Tertunda', valueKey: 'pendingTasks', icon: 'alert-triangle', color: 'rose' },
    ],
    widgets: [
      { id: 'progres_dept', component: 'DepartmentProgress', size: 'full' },
      { id: 'kalender_dept', component: 'AgendaCalendar', size: 'medium' },
      { id: 'persetujuan_dept', component: 'ApprovalQueue', size: 'medium' },
    ],
    quickActions: [
      { id: 'evaluasi_proker', label: 'Evaluasi Proker', icon: 'check-square', href: '/proker/evaluasi', color: 'primary' },
      { id: 'rapat_kordinasi', label: 'Buat Rapat', icon: 'calendar-check', href: '/rapat/new', color: 'secondary' },
    ],
    notificationPriority: [],
  },

  ketua_panitia: {
    roleSlug: 'ketua_panitia',
    roleName: 'Ketua Pelaksana',
    scope: 'committee',
    defaultPage: '/',
    greeting: 'Pantau persiapan acara Anda.',
    kpis: [
      { id: 'h_minus', label: 'H- Acara', valueKey: 'daysToEvent', icon: 'clock', color: 'accent-gold' },
      { id: 'persentase_persiapan', label: 'Kesiapan Acara', valueKey: 'readinessScore', trendKey: 'readinessTrend', trendDirection: 'up', icon: 'trending-up', color: 'sage' },
      { id: 'tiket_terjual', label: 'Tiket Terjual', valueKey: 'ticketsSold', icon: 'ticket', color: 'accent-blue' },
      { id: 'dana_terkumpul', label: 'Dana Terkumpul', valueKey: 'fundsCollected', icon: 'dollar-sign', color: 'sage' },
    ],
    widgets: [
      { id: 'event_countdown', component: 'EventCountdown', size: 'medium' },
      { id: 'project_timeline', component: 'ProjectTimeline', size: 'medium' },
      { id: 'ticket_sales', component: 'TicketSales', size: 'full' },
      { id: 'committee_structure', component: 'CommitteeStructure', size: 'medium' },
      { id: 'task_list', component: 'TaskList', size: 'medium' },
    ],
    quickActions: [
      { id: 'update_timeline', label: 'Update Timeline', icon: 'calendar', href: '/committee/timeline', color: 'primary' },
      { id: 'broadcast_panitia', label: 'Pesan Panitia', icon: 'megaphone', color: 'secondary' },
    ],
    notificationPriority: [],
  },

  // Basic fallback for other roles to be implemented later
  staf: {
    roleSlug: 'staf',
    roleName: 'Staf',
    scope: 'department',
    defaultPage: '/',
    greeting: 'Selamat bekerja.',
    kpis: [
      { id: 'task_saya', label: 'Tugas Saya', valueKey: 'myTasks', icon: 'check-square', color: 'accent-blue' },
      { id: 'deadline_minggu', label: 'Deadline Minggu Ini', valueKey: 'upcomingDeadlines', icon: 'clock', color: 'accent-gold' },
    ],
    widgets: [
      { id: 'task_list', component: 'TaskList', size: 'full' },
      { id: 'agenda_calendar', component: 'AgendaCalendar', size: 'medium' },
    ],
    quickActions: [
      { id: 'update_tugas', label: 'Update Tugas', icon: 'edit', color: 'primary' },
      { id: 'ajukan_izin', label: 'Ajukan Izin', icon: 'file-text', color: 'secondary' },
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
      { id: 'task_saya', label: 'Tugas Saya', valueKey: 'myTasks', icon: 'check-square', color: 'accent-blue' },
      { id: 'deadline_minggu', label: 'Deadline Minggu Ini', valueKey: 'upcomingDeadlines', icon: 'clock', color: 'accent-gold' },
    ],
    widgets: [
      { id: 'task_list', component: 'TaskList', size: 'full' },
      { id: 'agenda_calendar', component: 'AgendaCalendar', size: 'medium' },
    ],
    quickActions: [
      { id: 'update_tugas', label: 'Update Tugas', icon: 'edit', color: 'primary' },
      { id: 'ajukan_izin', label: 'Ajukan Izin', icon: 'file-text', color: 'secondary' },
    ],
    notificationPriority: [],
  }
};

export const getDashboardConfig = (roleSlug: string): DashboardConfig => {
  return dashboardRegistry[roleSlug] || dashboardRegistry['staf'];
};
