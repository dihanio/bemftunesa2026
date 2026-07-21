import { NavigationRegistryItem } from '../types/registry';

/**
 * Navigation Registry
 * Defines all possible menus in the application.
 * Filtering will be done by a composer mapping context against requiredRoles/Permissions.
 */
export const navigationRegistry: readonly NavigationRegistryItem[] = Object.freeze([
  {
    id: 'dashboard',
    title: 'DASHBOARD',
    requiredPermissions: [],
    requiredRoles: [],
    children: [
      { id: 'overview', title: 'Overview', href: '/', icon: 'layout-dashboard', requiredPermissions: [], requiredRoles: [] }
    ]
  },
  {
    id: 'struktur',
    title: 'ADMINISTRASI & STRUKTUR',
    requiredPermissions: [],
    requiredRoles: ['super-admin', 'kabem', 'wakabem', 'sekretaris', 'bendahara'], // Example basic static gating, strict permission in Phase 2
    children: [
      { id: 'fungsionaris', title: 'Fungsionaris', href: '/struktur/fungsionaris', icon: 'users', requiredPermissions: [], requiredRoles: [] },
      { id: 'departemen', title: 'Departemen', href: '/struktur/departemen', icon: 'network', requiredPermissions: [], requiredRoles: [] },
      { id: 'persuratan', title: 'E-Surat & Arsip', href: '/persuratan', icon: 'file-text', requiredPermissions: [], requiredRoles: [] },
    ]
  },
  {
    id: 'publikasi',
    title: 'PUBLIKASI & EKSTERNAL',
    requiredPermissions: [],
    requiredRoles: [], // Gating done at child level based on granular permissions
    children: [
      { id: 'berita', title: 'Berita & Konten', href: '/berita', icon: 'newspaper', requiredPermissions: ['content:read'], requiredRoles: [] },
      { id: 'aspirasi', title: 'Aspirasi Mahasiswa', href: '/aspirasi', icon: 'message-square', requiredPermissions: ['aspiration:read'], requiredRoles: [] },
      { id: 'oprec', title: 'Open Recruitment', href: '/oprec', icon: 'user-plus', requiredPermissions: [], requiredRoles: ['super-admin', 'kabem', 'wakabem', 'kadep'] }, // Keep role based for now if no specific perm
      { id: 'galeri', title: 'Galeri', href: '/galeri', icon: 'image', requiredPermissions: ['gallery:read'], requiredRoles: [] },
    ]
  },
  {
    id: 'proker',
    title: 'PROGRAM KERJA',
    requiredPermissions: [],
    requiredRoles: [],
    children: [
      { id: 'daftar-proker', title: 'Daftar Proker', href: '/proker', icon: 'clipboard-list', requiredPermissions: [], requiredRoles: [] },
      { id: 'kepanitiaan', title: 'Kepanitiaan', href: '/kepanitiaan', icon: 'users-round', requiredPermissions: [], requiredRoles: [] },
    ]
  },
  {
    id: 'pkkmb',
    title: 'PKKMB FT 2026',
    requiredPermissions: ['read:pkkmb'], // Strict permission check example
    requiredRoles: [], 
    children: [
      { id: 'pkkmb-overview', title: 'Overview', href: '/pkkmb', icon: 'book', requiredPermissions: [], requiredRoles: [] },
      { id: 'pkkmb-maba', title: 'Data Maba', href: '/pkkmb/maba', icon: 'users', requiredPermissions: [], requiredRoles: [] },
      { id: 'pkkmb-presensi', title: 'Sesi Presensi', href: '/pkkmb/presensi', icon: 'file-clock', requiredPermissions: [], requiredRoles: [] },
      { id: 'pkkmb-tugas', title: 'Penugasan Maba', href: '/pkkmb/tugas', icon: 'file-text', requiredPermissions: [], requiredRoles: [] },
    ]
  }
]);
