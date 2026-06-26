/**
 * BEM FT UNESA CMS Database Seeder
 *
 * Run with: npx ts-node --project tsconfig.json seeders/cms-seed.ts
 *
 * This seeds:
 * 1. All permissions (granular, per resource)
 * 2. Default roles with their permission sets
 * 3. Super Admin user account
 * 4. Default navigation menus
 * 5. Homepage sections skeleton
 * 6. Default site settings
 */

import 'reflect-metadata';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI as string;

// ====================== SCHEMAS (inline for seeder) ======================

const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  resource: { type: String, required: true },
  action: { type: String, required: true },
  description: String,
});

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const CabinetPeriodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    year: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', required: true },
    deletedAt: Date,
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    googleId: { type: String, sparse: true, unique: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    cabinetPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'CabinetPeriod', required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

const MenuItemChildSchema = new mongoose.Schema(
  { label: String, url: String, order: { type: Number, default: 0 }, target: { type: String, default: '_self' } },
  { _id: false },
);
const MenuItemSchema = new mongoose.Schema(
  { label: String, url: String, icon: String, order: { type: Number, default: 0 }, target: { type: String, default: '_self' }, children: [MenuItemChildSchema] },
  { _id: false },
);
const MenuSchema = new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, items: [MenuItemSchema], isActive: { type: Boolean, default: true } },
  { timestamps: true },
);

const HomepageSectionSchema = new mongoose.Schema(
  { sectionType: String, title: String, order: { type: Number, default: 0 }, isActive: { type: Boolean, default: true }, config: { type: mongoose.Schema.Types.Mixed, default: {} } },
  { timestamps: true },
);

const SettingSchema = new mongoose.Schema(
  { key: { type: String, required: true, unique: true }, value: mongoose.Schema.Types.Mixed, group: String, description: String },
  { timestamps: true },
);

// ====================== SEED DATA ======================

const PERMISSIONS = [
  // Users
  { name: 'user:read', resource: 'user', action: 'read', description: 'Read user list and profile' },
  { name: 'user:create', resource: 'user', action: 'create', description: 'Create a new user' },
  { name: 'user:update', resource: 'user', action: 'update', description: 'Update user info and role' },
  { name: 'user:delete', resource: 'user', action: 'delete', description: 'Deactivate a user' },
  // Roles
  { name: 'role:read', resource: 'role', action: 'read', description: 'Read roles and permissions' },
  { name: 'role:create', resource: 'role', action: 'create', description: 'Create a new role' },
  { name: 'role:update', resource: 'role', action: 'update', description: 'Update a role' },
  { name: 'role:delete', resource: 'role', action: 'delete', description: 'Delete a role' },
  // Content (News, Announcement, Page, Service)
  { name: 'content:read', resource: 'content', action: 'read', description: 'Read contents' },
  { name: 'content:create', resource: 'content', action: 'create', description: 'Create content' },
  { name: 'content:update', resource: 'content', action: 'update', description: 'Update content' },
  { name: 'content:publish', resource: 'content', action: 'publish', description: 'Change content status (publish/archive)' },
  { name: 'content:delete', resource: 'content', action: 'delete', description: 'Delete content permanently' },
  // Events
  { name: 'event:read', resource: 'event', action: 'read', description: 'Read events' },
  { name: 'event:create', resource: 'event', action: 'create', description: 'Create event' },
  { name: 'event:update', resource: 'event', action: 'update', description: 'Update event' },
  { name: 'event:publish', resource: 'event', action: 'publish', description: 'Publish/archive event' },
  { name: 'event:delete', resource: 'event', action: 'delete', description: 'Delete event' },
  // Departments
  { name: 'department:read', resource: 'department', action: 'read', description: 'Read departments' },
  { name: 'department:create', resource: 'department', action: 'create', description: 'Create department' },
  { name: 'department:update', resource: 'department', action: 'update', description: 'Update department' },
  { name: 'department:delete', resource: 'department', action: 'delete', description: 'Delete department' },
  // Media
  { name: 'media:read', resource: 'media', action: 'read', description: 'Browse media library' },
  { name: 'media:create', resource: 'media', action: 'create', description: 'Upload files' },
  { name: 'media:update', resource: 'media', action: 'update', description: 'Update media metadata' },
  { name: 'media:delete', resource: 'media', action: 'delete', description: 'Delete media files' },
  // Menus
  { name: 'menu:read', resource: 'menu', action: 'read', description: 'Read menus' },
  { name: 'menu:create', resource: 'menu', action: 'create', description: 'Create menu' },
  { name: 'menu:update', resource: 'menu', action: 'update', description: 'Update menu' },
  { name: 'menu:delete', resource: 'menu', action: 'delete', description: 'Delete menu' },
  // Settings & Homepage
  { name: 'settings:read', resource: 'settings', action: 'read', description: 'Read site settings' },
  { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update site settings and homepage' },
  // Audit
  { name: 'audit:read', resource: 'audit', action: 'read', description: 'View audit logs' },
  // Partners & Sponsors
  { name: 'partners:read', resource: 'partners', action: 'read', description: 'Read partners and sponsors' },
  { name: 'partners:create', resource: 'partners', action: 'create', description: 'Create partner/sponsor' },
  { name: 'partners:update', resource: 'partners', action: 'update', description: 'Update partner/sponsor' },
  { name: 'partners:delete', resource: 'partners', action: 'delete', description: 'Delete partner/sponsor' },
  // Recruitment (Open Recruitment / Oprec)
  { name: 'recruitment:read', resource: 'recruitment', action: 'read', description: 'Read recruitment posts' },
  { name: 'recruitment:create', resource: 'recruitment', action: 'create', description: 'Create recruitment' },
  { name: 'recruitment:update', resource: 'recruitment', action: 'update', description: 'Update recruitment' },
  { name: 'recruitment:publish', resource: 'recruitment', action: 'publish', description: 'Open/close recruitment' },
  { name: 'recruitment:delete', resource: 'recruitment', action: 'delete', description: 'Delete recruitment' },
  // Gallery
  { name: 'gallery:read', resource: 'gallery', action: 'read', description: 'Read gallery albums' },
  { name: 'gallery:create', resource: 'gallery', action: 'create', description: 'Create gallery album' },
  { name: 'gallery:update', resource: 'gallery', action: 'update', description: 'Update gallery album / manage photos' },
  { name: 'gallery:publish', resource: 'gallery', action: 'publish', description: 'Publish/archive gallery album' },
  { name: 'gallery:delete', resource: 'gallery', action: 'delete', description: 'Delete gallery album' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  'super-admin': PERMISSIONS.map((p) => p.name), // All permissions
  'admin': [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'content:read', 'content:create', 'content:update', 'content:publish', 'content:delete',
    'event:read', 'event:create', 'event:update', 'event:publish', 'event:delete',
    'department:read', 'department:create', 'department:update', 'department:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'menu:read', 'menu:create', 'menu:update', 'menu:delete',
    'settings:read', 'settings:update',
    'audit:read',
    'partners:read', 'partners:create', 'partners:update', 'partners:delete',
    'recruitment:read', 'recruitment:create', 'recruitment:update', 'recruitment:publish', 'recruitment:delete',
    'gallery:read', 'gallery:create', 'gallery:update', 'gallery:publish', 'gallery:delete',
  ],
  'editor': [
    'content:read', 'content:create', 'content:update', 'content:publish', 'content:delete',
    'event:read', 'event:create', 'event:update', 'event:publish', 'event:delete',
    'department:read', 'department:update',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'menu:read',
    'settings:read',
    'partners:read', 'partners:create', 'partners:update',
    'recruitment:read', 'recruitment:create', 'recruitment:update', 'recruitment:publish',
    'gallery:read', 'gallery:create', 'gallery:update', 'gallery:publish',
  ],
  'author': [
    'content:read', 'content:create', 'content:update',
    'event:read', 'event:create', 'event:update',
    'department:read',
    'media:read', 'media:create', 'media:update',
    'gallery:read', 'gallery:create', 'gallery:update',
    'recruitment:read',
  ],
  'kabem': [
    'content:read', 'content:publish',
    'event:read', 'event:publish',
    'department:read',
    'media:read',
    'settings:read',
    'menu:read',
    'audit:read',
    'user:read',
    'role:read',
  ],
  'wakabem': [
    'content:read',
    'event:read',
    'department:read',
    'media:read',
    'settings:read',
    'menu:read',
    'audit:read',
    'user:read',
  ],
};

const ROLES = [
  { name: 'Super Admin', slug: 'super-admin', description: 'Full access to everything', isSystem: true },
  { name: 'Admin Website', slug: 'admin', description: 'Manages website content and structure', isSystem: true },
  { name: 'Editor', slug: 'editor', description: 'Can create, edit, and publish content', isSystem: true },
  { name: 'Author', slug: 'author', description: 'Can create and edit own content (cannot publish)', isSystem: true },
  { name: 'Kabem', slug: 'kabem', description: 'Ketua BEM — oversight and publishing approval', isSystem: true },
  { name: 'Wakabem', slug: 'wakabem', description: 'Wakil Ketua BEM — read and monitor', isSystem: true },
];

const DEFAULT_MENUS = [
  {
    name: 'Navbar Utama',
    slug: 'navbar',
    isActive: true,
    items: [
      { label: 'Beranda', url: '/', order: 0 },
      { label: 'Tentang', url: '/tentang', order: 1 },
      { label: 'Berita', url: '/berita', order: 2 },
      { label: 'Event', url: '/event', order: 3 },
      { label: 'Departemen', url: '/departemen', order: 4 },
      { label: 'Kontak', url: '/kontak', order: 5 },
    ],
  },
  {
    name: 'Footer',
    slug: 'footer',
    isActive: true,
    items: [
      { label: 'Tentang BEM FT UNESA', url: '/tentang', order: 0 },
      { label: 'Berita', url: '/berita', order: 1 },
      { label: 'Event', url: '/event', order: 2 },
      { label: 'Kontak', url: '/kontak', order: 3 },
    ],
  },
];

const DEFAULT_HOMEPAGE = [
  { sectionType: 'hero', title: 'Hero Section', order: 0, isActive: true, config: { headline: 'Badan Eksekutif Mahasiswa Fakultas Teknik UNESA', subheadline: 'Bergerak Bersama, Membangun Kampus' } },
  { sectionType: 'about', title: 'Tentang BEM', order: 1, isActive: true, config: {} },
  { sectionType: 'statistics', title: 'Statistik', order: 2, isActive: true, config: { items: [] } },
  { sectionType: 'news', title: 'Berita Terbaru', order: 3, isActive: true, config: { limit: 6 } },
  { sectionType: 'events', title: 'Event Mendatang', order: 4, isActive: true, config: { limit: 4 } },
  { sectionType: 'partners', title: 'Mitra & Sponsor', order: 5, isActive: true, config: {} },
  { sectionType: 'cta', title: 'Call to Action', order: 6, isActive: true, config: { buttonText: 'Hubungi Kami', buttonUrl: '/kontak' } },
];

const DEFAULT_SETTINGS = [
  { key: 'site.name', value: 'BEM FT UNESA', group: 'general', description: 'Website name' },
  { key: 'site.tagline', value: 'Bergerak Bersama, Membangun Kampus', group: 'general', description: 'Website tagline' },
  { key: 'site.email', value: 'bemft@unesa.ac.id', group: 'general', description: 'Official contact email' },
  { key: 'site.logo', value: null, group: 'general', description: 'Site logo (Media ID)' },
  { key: 'seo.defaultTitle', value: 'BEM FT UNESA', group: 'seo', description: 'Default meta title' },
  { key: 'seo.defaultDescription', value: 'Website resmi Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya', group: 'seo', description: 'Default meta description' },
  { key: 'social.instagram', value: '', group: 'social', description: 'Instagram URL' },
  { key: 'social.twitter', value: '', group: 'social', description: 'Twitter/X URL' },
  { key: 'social.youtube', value: '', group: 'social', description: 'YouTube channel URL' },
  { key: 'social.linkedin', value: '', group: 'social', description: 'LinkedIn URL' },
];

// ====================== SEEDER RUNNER ======================

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log(`✅ Connected to: ${MONGO_URI}`);

  const PermissionModel = mongoose.model('Permission', PermissionSchema);
  const RoleModel = mongoose.model('Role', RoleSchema);
  const UserModel = mongoose.model('User', UserSchema);
  const CabinetPeriodModel = mongoose.model('CabinetPeriod', CabinetPeriodSchema);
  const MenuModel = mongoose.model('Menu', MenuSchema);
  const HomepageSectionModel = mongoose.model('HomepageSection', HomepageSectionSchema);
  const SettingModel = mongoose.model('Setting', SettingSchema);

  // 1. Seed Permissions
  console.log('\n📌 Seeding permissions...');
  const permissionDocs: Record<string, mongoose.Types.ObjectId> = {};
  for (const perm of PERMISSIONS) {
    const doc = await PermissionModel.findOneAndUpdate(
      { name: perm.name },
      { $set: perm },
      { upsert: true, new: true },
    );
    permissionDocs[perm.name] = doc._id as mongoose.Types.ObjectId;
  }
  console.log(`  ✅ ${PERMISSIONS.length} permissions seeded`);

  // 2. Seed Roles
  console.log('\n📌 Seeding roles...');
  const roleDocs: Record<string, mongoose.Types.ObjectId> = {};
  for (const role of ROLES) {
    const permIds = (ROLE_PERMISSIONS[role.slug] ?? []).map((n) => permissionDocs[n]).filter(Boolean);
    const doc = await RoleModel.findOneAndUpdate(
      { slug: role.slug },
      { $set: { ...role, permissions: permIds } },
      { upsert: true, new: true },
    );
    roleDocs[role.slug] = doc._id as mongoose.Types.ObjectId;
  }
  console.log(`  ✅ ${ROLES.length} roles seeded`);

  // Seed Default Cabinet Period
  console.log('\n📌 Seeding default Cabinet Period...');
  const cabinetDoc = await CabinetPeriodModel.findOneAndUpdate(
    { name: 'Kabinet Danadyaksa 2026' },
    { $set: { name: 'Kabinet Danadyaksa 2026', year: 2026, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active' } },
    { upsert: true, new: true },
  );
  console.log(`  ✅ Default Cabinet Period seeded`);

  // 3. Seed Super Admin User
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    console.log('\n📌 Seeding Super Admin user...');
    const superAdminRoleId = roleDocs['super-admin'];
    await UserModel.findOneAndUpdate(
      { email: adminEmail },
      { $set: { name: 'Super Admin', email: adminEmail, role: superAdminRoleId, cabinetPeriod: cabinetDoc._id, isActive: true } },
      { upsert: true, new: true },
    );
    console.log(`  ✅ Super Admin user seeded: ${adminEmail}`);
    console.log(`  ℹ️  Login with Google OAuth using this email to gain access.`);
  } else {
    console.log('\n⚠️  ADMIN_EMAIL not set in .env — skipping Super Admin user creation');
  }

  // 4. Seed Default Menus
  console.log('\n📌 Seeding default menus...');
  for (const menu of DEFAULT_MENUS) {
    await MenuModel.findOneAndUpdate(
      { slug: menu.slug },
      { $setOnInsert: menu },
      { upsert: true, new: true },
    );
  }
  console.log(`  ✅ ${DEFAULT_MENUS.length} menus seeded`);

  // 5. Seed Homepage Sections (only if none exist)
  console.log('\n📌 Seeding homepage sections...');
  const existingCount = await HomepageSectionModel.countDocuments();
  if (existingCount === 0) {
    await HomepageSectionModel.insertMany(DEFAULT_HOMEPAGE);
    console.log(`  ✅ ${DEFAULT_HOMEPAGE.length} homepage sections seeded`);
  } else {
    console.log(`  ⏭️  Homepage sections already exist (${existingCount} found) — skipping`);
  }

  // 6. Seed Default Settings
  console.log('\n📌 Seeding default settings...');
  for (const setting of DEFAULT_SETTINGS) {
    await SettingModel.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: true },
    );
  }
  console.log(`  ✅ ${DEFAULT_SETTINGS.length} settings seeded`);

  await mongoose.disconnect();
  console.log('\n🎉 CMS Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Roles created: Super Admin, Admin Website, Editor, Author, Kabem, Wakabem');
  console.log('Next step: Sign in with Google OAuth using your ADMIN_EMAIL to start managing content.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
