import { SidebarSection } from '../types/role-types';

export type { SidebarSection };

const basicMenu: SidebarSection[] = [
  {
    id: 'utama',
    label: 'UTAMA',
    items: [
      { name: 'Overview', path: '/', icon: 'layout-dashboard', status: 'active' },
    ]
  }
];

export const sidebarRegistry: Record<string, SidebarSection[]> = {
  kabem: basicMenu,
  sekretaris: basicMenu,
  bendahara: basicMenu,
  kadep: basicMenu,
  'super-admin': basicMenu,
  staf: basicMenu,
  user: basicMenu,
};

export const getSidebarConfig = (roleSlug: string): SidebarSection[] => {
  return sidebarRegistry[roleSlug] || basicMenu;
};
