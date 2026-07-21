/**
 * RBAC Role Constants — Single source of truth for role slugs.
 * 
 * Sesuai dokumentasi organisasi BEM FT:
 * - BPI dipecah menjadi 7 jabatan spesifik
 * - BPH: kadep, wakadep
 * - Staff: staf
 * 
 * Backward compat: slug lama (sekretaris, bendahara) tetap dipertahankan 
 * di dalam grouping agar token/session lama tetap valid.
 */

// --- Individual Role Slugs ---
export const ROLE_SUPER_ADMIN = 'super-admin';
export const ROLE_KABEM = 'kabem';
export const ROLE_WAKABEM = 'wakabem';
export const ROLE_SEKRETARIS_UMUM = 'sekretaris-umum';
export const ROLE_SEKRETARIS_KEGIATAN = 'sekretaris-kegiatan';
export const ROLE_SEKRETARIS_ADMINISTRASI = 'sekretaris-administrasi';
export const ROLE_BENDAHARA_UMUM = 'bendahara-umum';
export const ROLE_BENDAHARA_KEGIATAN = 'bendahara-kegiatan';
export const ROLE_KADEP = 'kadep';
export const ROLE_WAKADEP = 'wakadep';
export const ROLE_STAF = 'staf';

// --- Legacy slugs (backward compat, akan di-deprecate) ---
export const ROLE_SEKRETARIS_LEGACY = 'sekretaris';
export const ROLE_BENDAHARA_LEGACY = 'bendahara';

// --- Groupings for @Roles() decorator ---

/** BPI Pimpinan: Ketua + Wakil */
export const ROLES_BPI_PIMPINAN = [ROLE_SUPER_ADMIN, ROLE_KABEM, ROLE_WAKABEM] as const;

/** Semua Sekretaris (termasuk slug lama) */
export const ROLES_SEKRETARIS = [
  ROLE_SEKRETARIS_UMUM,
  ROLE_SEKRETARIS_KEGIATAN,
  ROLE_SEKRETARIS_ADMINISTRASI,
  ROLE_SEKRETARIS_LEGACY, // backward compat
] as const;

/** Semua Bendahara (termasuk slug lama) */
export const ROLES_BENDAHARA = [
  ROLE_BENDAHARA_UMUM,
  ROLE_BENDAHARA_KEGIATAN,
  ROLE_BENDAHARA_LEGACY, // backward compat
] as const;

/** Seluruh BPI */
export const ROLES_BPI = [
  ...ROLES_BPI_PIMPINAN,
  ...ROLES_SEKRETARIS,
  ...ROLES_BENDAHARA,
] as const;

/** BPH (pimpinan departemen) */
export const ROLES_BPH = [ROLE_KADEP, ROLE_WAKADEP] as const;

/** Semua role yang bisa mengelola persuratan */
export const ROLES_SURAT_ADMIN = [
  ROLE_SUPER_ADMIN,
  ROLE_KABEM,
  ROLE_WAKABEM,
  ROLE_SEKRETARIS_UMUM,
  ROLE_SEKRETARIS_ADMINISTRASI,
  ROLE_SEKRETARIS_LEGACY,
] as const;

/** Semua role yang bisa mengelola keuangan */
export const ROLES_KEUANGAN = [
  ROLE_SUPER_ADMIN,
  ROLE_KABEM,
  ROLE_BENDAHARA_UMUM,
  ROLE_BENDAHARA_KEGIATAN,
  ROLE_BENDAHARA_LEGACY,
] as const;

/** Semua role yang bisa manage proker */
export const ROLES_PROKER_ADMIN = [
  ROLE_SUPER_ADMIN,
  ROLE_KABEM,
  ROLE_WAKABEM,
  ...ROLES_SEKRETARIS,
  ROLE_KADEP,
] as const;

/** Semua role yang bisa delete (hanya pimpinan tertinggi) */
export const ROLES_DELETE = [ROLE_SUPER_ADMIN, ROLE_KABEM] as const;
