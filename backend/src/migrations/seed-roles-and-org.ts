/**
 * Migration: Seed BEM FT roles & default organization.
 *
 * Idempotent — safe to run multiple times.
 * Run via: npx ts-node src/migrations/seed-roles-and-org.ts
 */
import { connect, model, Schema, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const RoleSchema = new Schema(
  {
    name: String,
    slug: { type: String, unique: true, lowercase: true },
    description: String,
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isSystem: { type: Boolean, default: false },
    scope: {
      type: String,
      enum: ['global', 'department'],
      default: 'department',
    },
  },
  { timestamps: true },
);

const PermissionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
    description: String,
  },
  { timestamps: false },
);

const OrganizationSchema = new Schema(
  {
    name: String,
    period: { type: String, unique: true },
    vision: String,
    missions: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const DepartmentSchema = new Schema({
  name: String,
  slug: String,
  code: { type: String, uppercase: true },
  description: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  taskBoardUrl: String,
});

const Role = model('Role', RoleSchema);
const Permission = model('Permission', PermissionSchema);
const Organization = model('Organization', OrganizationSchema);
const Department = model('Department', DepartmentSchema);

const ROLES_TO_SEED = [
  // BPI — Global scope
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Administrator sistem',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Ketua BEM',
    slug: 'kabem',
    description: 'Ketua BEM FT — akses penuh',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Wakil Ketua BEM',
    slug: 'wakabem',
    description: 'Wakil Ketua BEM FT',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Sekretaris Umum',
    slug: 'sekretaris-umum',
    description: 'Mengelola surat, arsip, dokumen, notulensi',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Sekretaris Kegiatan',
    slug: 'sekretaris-kegiatan',
    description: 'Mengelola agenda, kalender, jadwal rapat, timeline proker',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Sekretaris Administrasi',
    slug: 'sekretaris-administrasi',
    description: 'Mengelola administrasi internal dan dokumen operasional',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Bendahara Umum',
    slug: 'bendahara-umum',
    description: 'Mengelola kas dan anggaran organisasi',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Bendahara Kegiatan',
    slug: 'bendahara-kegiatan',
    description: 'Mengelola anggaran per Program Kerja',
    scope: 'global',
    isSystem: true,
  },

  // Legacy BPI (backward compat)
  {
    name: 'Sekretaris (Legacy)',
    slug: 'sekretaris',
    description: 'Legacy — akan di-deprecate',
    scope: 'global',
    isSystem: true,
  },
  {
    name: 'Bendahara (Legacy)',
    slug: 'bendahara',
    description: 'Legacy — akan di-deprecate',
    scope: 'global',
    isSystem: true,
  },

  // BPH — Department scope
  {
    name: 'Ketua Departemen',
    slug: 'kadep',
    description: 'Memimpin departemen, mengelola staff & proker',
    scope: 'department',
    isSystem: true,
  },
  {
    name: 'Wakil Ketua Departemen',
    slug: 'wakadep',
    description: 'Membantu Kadep, mengawasi proker',
    scope: 'department',
    isSystem: true,
  },

  // Staff
  {
    name: 'Staff',
    slug: 'staf',
    description: 'Anggota aktif departemen',
    scope: 'department',
    isSystem: true,
  },

  // Generic user (non-functionary)
  {
    name: 'User',
    slug: 'user',
    description: 'Akun terdaftar tanpa jabatan',
    scope: 'global',
    isSystem: true,
  },
];

const DEPARTMENT_CODES: Record<string, string> = {
  'aksi-strategi-dan-narasi': 'ASN',
  'advokasi-mahasiswa': 'ADVOKASI',
  'ekonomi-kreatif': 'EKRAF',
  'sosial-dan-pengabdian': 'SOSPEN',
  'komunikasi-dan-media-informasi': 'KOMINFO',
  'dalam-negeri': 'DAGRI',
  'seni-dan-olahraga': 'SENOR',
  'riset-dan-teknologi': 'RISTEK',
  'luar-negeri': 'LUGRI',
};

async function run() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/bemft';
  console.log(`Connecting to ${uri.replace(/\/\/.*@/, '//***@')}...`);
  await connect(uri);

  // 1. Seed Permissions
  console.log('\n--- Seeding Permissions ---');
  const PERMISSIONS_TO_SEED = [
    {
      name: 'manage:all',
      resource: 'all',
      action: 'manage',
      description: 'Akses penuh ke semua fitur',
    },
    {
      name: 'content:read',
      resource: 'content',
      action: 'read',
      description: 'Membaca berita/pengumuman',
    },
    {
      name: 'content:create',
      resource: 'content',
      action: 'create',
      description: 'Membuat berita/pengumuman',
    },
    {
      name: 'content:update',
      resource: 'content',
      action: 'update',
      description: 'Mengedit berita/pengumuman',
    },
    {
      name: 'content:delete',
      resource: 'content',
      action: 'delete',
      description: 'Menghapus berita/pengumuman',
    },
    {
      name: 'content:publish',
      resource: 'content',
      action: 'publish',
      description: 'Mempublikasikan berita/pengumuman',
    },
    {
      name: 'gallery:read',
      resource: 'gallery',
      action: 'read',
      description: 'Membaca galeri',
    },
    {
      name: 'gallery:create',
      resource: 'gallery',
      action: 'create',
      description: 'Menambah galeri',
    },
    {
      name: 'gallery:update',
      resource: 'gallery',
      action: 'update',
      description: 'Mengedit galeri',
    },
    {
      name: 'gallery:delete',
      resource: 'gallery',
      action: 'delete',
      description: 'Menghapus galeri',
    },
    {
      name: 'aspiration:read',
      resource: 'aspiration',
      action: 'read',
      description: 'Membaca aspirasi',
    },
    {
      name: 'aspiration:update',
      resource: 'aspiration',
      action: 'update',
      description: 'Menjawab aspirasi',
    },
  ];

  const permissionMap: Record<string, import('mongoose').Types.ObjectId> = {};
  for (const p of PERMISSIONS_TO_SEED) {
    let existingP = await Permission.findOne({ name: p.name });
    if (!existingP) {
      existingP = await Permission.create(p);
      console.log(`  [CREATE] Permission "${p.name}"`);
    }
    permissionMap[p.name] = existingP._id;
  }

  // 2. Seed Roles (upsert by slug) and assign basic permissions
  console.log('\n--- Seeding Roles ---');
  for (const r of ROLES_TO_SEED) {
    let permissions: import('mongoose').Types.ObjectId[] = [];
    if (['super-admin', 'kabem', 'wakabem'].includes(r.slug)) {
      permissions = [permissionMap['manage:all']];
    } else if (
      [
        'kadep',
        'wakadep',
        'staf',
        'sekretaris-umum',
        'bendahara-umum',
      ].includes(r.slug)
    ) {
      permissions = [
        permissionMap['content:read'],
        permissionMap['content:create'],
        permissionMap['content:update'],
        permissionMap['content:delete'],
        permissionMap['content:publish'],
        permissionMap['gallery:read'],
        permissionMap['gallery:create'],
        permissionMap['gallery:update'],
        permissionMap['gallery:delete'],
        permissionMap['aspiration:read'],
        permissionMap['aspiration:update'],
      ];
    } else {
      permissions = [
        permissionMap['content:read'],
        permissionMap['gallery:read'],
      ]; // default readable
    }

    const existing = await Role.findOne({
      $or: [{ slug: r.slug }, { name: r.name }],
    });
    if (existing) {
      Object.assign(existing, r);
      existing.permissions = permissions;
      await existing.save();
      console.log(`  [UPDATE] Role "${r.slug}"`);
    } else {
      await Role.create({ ...r, permissions });
      console.log(`  [CREATE] Role "${r.slug}"`);
    }
  }

  // 2. Seed Default Organization
  console.log('\n--- Seeding Organization ---');
  const existingOrg = await Organization.findOne({ period: '2026' });
  if (existingOrg) {
    console.log('  [SKIP] Organization period 2026 already exists');
  } else {
    await Organization.create({
      name: 'Kabinet BEM FT UNESA 2026',
      period: '2026',
      vision: '',
      missions: [],
      isActive: true,
    });
    console.log('  [CREATE] Organization "Kabinet BEM FT UNESA 2026"');
  }

  // 3. Backfill Department codes
  console.log('\n--- Backfilling Department Codes ---');
  const departments = await Department.find({});
  for (const dept of departments) {
    if (dept.code) {
      console.log(`  [SKIP] ${dept.slug} already has code "${dept.code}"`);
      continue;
    }
    const slug = dept.slug as string | undefined;
    const code =
      (slug && DEPARTMENT_CODES[slug]) ||
      slug?.toUpperCase().replace(/-/g, '').slice(0, 8);
    if (code) {
      dept.code = code;
      await dept.save();
      console.log(`  [UPDATE] ${dept.slug} -> code "${code}"`);
    }
  }

  console.log('\nDone! Migration complete.');
  await connection.close();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
