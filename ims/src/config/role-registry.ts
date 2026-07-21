import { RoleRegistryItem } from '../types/registry';

/**
 * Role Registry
 * Single Source of Truth for Role metadata and priority.
 * Used purely by Role Resolver. Immutable.
 */
export const roleRegistry: Record<string, RoleRegistryItem> = Object.freeze({
  'super-admin': {
    slug: 'super-admin',
    label: 'Super Administrator',
    icon: 'shield',
    priority: 100,
    description: 'System administrator with unrestricted access',
  },
  'kabem': {
    slug: 'kabem',
    label: 'Ketua BEM',
    icon: 'crown',
    priority: 90,
  },
  'wakabem': {
    slug: 'wakabem',
    label: 'Wakil Ketua BEM',
    icon: 'star',
    priority: 85,
  },
  'sekretaris': {
    slug: 'sekretaris',
    label: 'Sekretaris Umum',
    icon: 'file-text',
    priority: 80,
  },
  'bendahara': {
    slug: 'bendahara',
    label: 'Bendahara Umum',
    icon: 'wallet',
    priority: 80,
  },
  'kadep': {
    slug: 'kadep',
    label: 'Ketua Departemen',
    icon: 'users',
    priority: 70,
  },
  'wakadep': {
    slug: 'wakadep',
    label: 'Wakil Ketua Departemen',
    icon: 'user-check',
    priority: 65,
  },
  'staf': {
    slug: 'staf',
    label: 'Staf Departemen',
    icon: 'user',
    priority: 50,
  },
  'ketua_panitia': {
    slug: 'ketua_panitia',
    label: 'Ketua Panitia',
    icon: 'flag',
    priority: 40,
  },
  'user': {
    slug: 'user',
    label: 'Pengguna Biasa',
    icon: 'user',
    priority: 10,
  }
});
