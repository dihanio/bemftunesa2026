import { DashboardConfig } from '../types/role-types';

const emptyConfig = (roleSlug: string, roleName: string): DashboardConfig => ({
  roleSlug,
  roleName,
  scope: 'global',
  defaultPage: '/',
  greeting: 'Selamat datang di dashboard.',
  kpis: [],
  widgets: [],
  quickActions: [],
  notificationPriority: [],
});

export const dashboardRegistry: Record<string, DashboardConfig> = {
  kabem: emptyConfig('kabem', 'Ketua BEM'),
  sekretaris: emptyConfig('sekretaris', 'Sekretaris Umum'),
  bendahara: emptyConfig('bendahara', 'Bendahara Umum'),
  'super-admin': emptyConfig('super-admin', 'Super Administrator'),
  kadep: emptyConfig('kadep', 'Kepala Departemen'),
  ketua_panitia: emptyConfig('ketua_panitia', 'Ketua Pelaksana'),
  staf: emptyConfig('staf', 'Staf'),
  user: emptyConfig('user', 'Anggota / User'),
};

export const getDashboardConfig = (roleSlug: string): DashboardConfig => {
  return dashboardRegistry[roleSlug] || dashboardRegistry['staf'];
};
