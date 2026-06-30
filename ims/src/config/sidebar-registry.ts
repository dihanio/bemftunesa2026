import { SidebarSection, RoleSlug } from '../types/role-types';

export type { SidebarSection, RoleSlug };

export const sidebarRegistry: Record<string, SidebarSection[]> = {
  kabem: [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Overview', path: '/', icon: 'layout-dashboard', status: 'active' },
        { name: 'Berita & Artikel', path: '/berita', icon: 'newspaper', status: 'active' },
        { name: 'Rapat & Absensi', path: '/rapat', icon: 'users', status: 'active' },
        { name: 'Program Kerja', path: '/proker', icon: 'briefcase', status: 'active' },
      ]
    },
    {
      id: 'persuratan',
      label: 'PERSURATAN',
      items: [
        { name: 'Daftar Surat', path: '/surat', icon: 'file-text', status: 'active' },
      ]
    },
    {
      id: 'document-platform',
      label: 'DOCUMENT PLATFORM',
      items: [
        { name: 'Template', path: '/templates', icon: 'file-type', status: 'active' },
        { name: 'Numbering', path: '/numbering', icon: 'hash', status: 'active' },
        { name: 'Workflow', path: '/workflows', icon: 'git-merge', status: 'active' },
      ]
    },
    {
      id: 'organisasi',
      label: 'ORGANISASI',
      items: [
        { name: 'Struktur', path: '/organizations/structure', icon: 'network', status: 'active' },
        { name: 'Departemen', path: '/organizations/departments', icon: 'building-2', status: 'active' },
        { name: 'Profil BEM', path: '/settings/about', icon: 'settings', status: 'active' },
      ]
    }
  ],
  
  sekretaris: [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Overview', path: '/', icon: 'layout-dashboard', status: 'active' },
        { name: 'Rapat & Absensi', path: '/rapat', icon: 'users', status: 'active' },
        { name: 'Program Kerja', path: '/proker', icon: 'briefcase', status: 'active' },
      ]
    },
    {
      id: 'persuratan',
      label: 'PERSURATAN',
      items: [
        { name: 'Daftar Surat', path: '/surat', icon: 'file-text', status: 'active' },
      ]
    },
    {
      id: 'document-platform',
      label: 'DOCUMENT PLATFORM',
      items: [
        { name: 'Template', path: '/templates', icon: 'file-type', status: 'active' },
        { name: 'Numbering', path: '/numbering', icon: 'hash', status: 'active' },
        { name: 'Workflow', path: '/workflows', icon: 'git-merge', status: 'active' },
      ]
    }
  ],

  bendahara: [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Overview', path: '/', icon: 'layout-dashboard', status: 'active' },
        { name: 'Persuratan', path: '/surat', icon: 'file-text', status: 'active' },
        { name: 'Rapat & Absensi', path: '/rapat', icon: 'users', status: 'active' },
        { name: 'Program Kerja', path: '/proker', icon: 'briefcase', status: 'active' },
      ]
    }
  ],

  kadep: [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Overview', path: '/', icon: 'layout-dashboard', status: 'active' },
        { name: 'Persuratan', path: '/surat', icon: 'file-text', status: 'active' },
        { name: 'Rapat & Absensi', path: '/rapat', icon: 'users', status: 'active' },
        { name: 'Program Kerja', path: '/proker', icon: 'briefcase', status: 'active' },
      ]
    }
  ],

  'super-admin': [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Overview', path: '/', icon: 'layout-dashboard', status: 'active' },
        { name: 'Berita & Artikel', path: '/berita', icon: 'newspaper', status: 'active' },
        { name: 'Rapat & Absensi', path: '/rapat', icon: 'users', status: 'active' },
        { name: 'Program Kerja', path: '/proker', icon: 'briefcase', status: 'active' },
      ]
    },
    {
      id: 'persuratan',
      label: 'PERSURATAN',
      items: [
        { name: 'Daftar Surat', path: '/surat', icon: 'file-text', status: 'active' },
      ]
    },
    {
      id: 'document-platform',
      label: 'DOCUMENT PLATFORM',
      items: [
        { name: 'Template', path: '/templates', icon: 'file-type', status: 'active' },
        { name: 'Numbering', path: '/numbering', icon: 'hash', status: 'active' },
        { name: 'Workflow', path: '/workflows', icon: 'git-merge', status: 'active' },
      ]
    },
    {
      id: 'system',
      label: 'SISTEM',
      items: [
        { name: 'User Management', path: '/settings/users', icon: 'users', status: 'active' },
        { name: 'Role & Access', path: '/settings/roles', icon: 'shield', status: 'active' },
        { name: 'Monitoring', path: '/settings/monitoring', icon: 'activity', status: 'active' },
        { name: 'Audit Trail', path: '/settings/audit', icon: 'list', status: 'active' },
      ]
    },
    {
      id: 'organisasi',
      label: 'ORGANISASI',
      items: [
        { name: 'Struktur', path: '/organizations/structure', icon: 'network', status: 'active' },
        { name: 'Departemen', path: '/organizations/departments', icon: 'building-2', status: 'active' },
        { name: 'Profil BEM', path: '/settings/about', icon: 'settings', status: 'active' },
      ]
    }
  ],

  staf: [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Dashboard Saya', path: '/', icon: 'layout-dashboard', status: 'active' },
        { name: 'Persuratan', path: '/surat', icon: 'file-text', status: 'active' },
        { name: 'Rapat & Absensi', path: '/rapat', icon: 'users', status: 'active' },
        { name: 'Program Kerja', path: '/proker', icon: 'briefcase', status: 'active' },
      ]
    }
  ],

  user: [
    {
      id: 'utama',
      label: 'UTAMA',
      items: [
        { name: 'Dashboard Saya', path: '/', icon: 'layout-dashboard', status: 'active' },
      ]
    }
  ]
};

export const getSidebarConfig = (roleSlug: string): SidebarSection[] => {
  return sidebarRegistry[roleSlug] || sidebarRegistry['staf'];
};
