/**
 * Seed script: ensures bypass/test users, roles, cabinet period, and departments exist.
 *
 * Usage:  npx ts-node src/seed/seed-test-users.ts
 *    or:  npx tsx    src/seed/seed-test-users.ts
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemft-cms';

// ── Schemas (inline, lightweight) ───────────────────────────────
const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

const DepartmentSchema = new mongoose.Schema({
  cabinetPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'CabinetPeriod', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const CabinetPeriodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  vision: String,
  mission: [String],
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  cabinetPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'CabinetPeriod', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  name: { type: String, required: true },
  nim: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String,
  position: String,
  googleId: { type: String, sparse: true, unique: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  deletedAt: Date,
}, { timestamps: true });

// ── Data ────────────────────────────────────────────────────────
const ROLES = [
  { name: 'Super Admin', slug: 'super-admin', description: 'Full system access', isSystem: true },
  { name: 'Ketua BEM', slug: 'kabem', description: 'Ketua BEM FT UNESA', isSystem: true },
  { name: 'Sekretaris', slug: 'sekretaris', description: 'Sekretaris BEM', isSystem: true },
  { name: 'Bendahara', slug: 'bendahara', description: 'Bendahara BEM', isSystem: true },
  { name: 'Kepala Departemen', slug: 'kadep', description: 'Kepala Departemen', isSystem: true },
  { name: 'Staf', slug: 'staf', description: 'Staf Departemen', isSystem: true },
];

const DEPARTMENTS = [
  { name: 'Komunikasi dan Informasi', slug: 'kominfo', order: 1 },
  { name: 'Pengembangan Sumber Daya Manusia', slug: 'psdm', order: 2 },
  { name: 'Riset dan Kajian', slug: 'riset', order: 3 },
  { name: 'Sosial dan Masyarakat', slug: 'sosmas', order: 4 },
  { name: 'Minat dan Bakat', slug: 'minbak', order: 5 },
  { name: 'Kewirausahaan', slug: 'kwu', order: 6 },
];

interface TestUser {
  name: string;
  email: string;
  roleSlug: string;
  position: string;
  departmentSlug?: string;
}

const TEST_USERS: TestUser[] = [
  { name: 'Super Admin', email: 'youremail@gmail.com', roleSlug: 'super-admin', position: 'Super Admin' },
  { name: 'Achmad Yusuf', email: 'yusuf@mhs.unesa.ac.id', roleSlug: 'kabem', position: 'Ketua BEM' },
  { name: 'Safira Rahma', email: 'safira@mhs.unesa.ac.id', roleSlug: 'sekretaris', position: 'Sekretaris' },
  { name: 'Farhan Syah', email: 'farhan@mhs.unesa.ac.id', roleSlug: 'bendahara', position: 'Bendahara' },
  { name: 'Rizky Dwi', email: 'rizky@mhs.unesa.ac.id', roleSlug: 'kadep', position: 'Kadep Kominfo', departmentSlug: 'kominfo' },
  { name: 'Agus Setiawan', email: 'agus@mhs.unesa.ac.id', roleSlug: 'staf', position: 'Staf PSDM', departmentSlug: 'psdm' },
];

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 Connecting to ${MONGODB_URI}...\n`);
  await mongoose.connect(MONGODB_URI);

  const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
  const CabinetPeriod = mongoose.models.CabinetPeriod || mongoose.model('CabinetPeriod', CabinetPeriodSchema);
  const Dept = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // 1. Upsert roles
  console.log('📌 Ensuring roles...');
  const roleMap = new Map<string, mongoose.Types.ObjectId>();
  for (const r of ROLES) {
    const doc = await Role.findOneAndUpdate(
      { slug: r.slug },
      { $setOnInsert: r },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    roleMap.set(r.slug, doc._id as mongoose.Types.ObjectId);
    console.log(`   ✓ ${r.name} (${r.slug})`);
  }

  // 2. Ensure cabinet period
  console.log('\n📌 Ensuring cabinet period...');
  let cabinet = await CabinetPeriod.findOne({ isActive: true });
  if (!cabinet) {
    cabinet = await CabinetPeriod.create({
      name: 'Kabinet Karya Nyata',
      year: '2025/2026',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
      vision: 'Mewujudkan BEM FT UNESA yang progresif dan berdampak',
      mission: [
        'Meningkatkan kualitas organisasi',
        'Membangun kolaborasi antar departemen',
        'Memperkuat advokasi mahasiswa',
      ],
    });
    console.log(`   ✓ Created "${cabinet.name}"`);
  } else {
    console.log(`   ✓ Using existing "${cabinet.name}"`);
  }
  const cabinetId = cabinet._id as mongoose.Types.ObjectId;

  // 3. Upsert departments
  console.log('\n📌 Ensuring departments...');
  const deptMap = new Map<string, mongoose.Types.ObjectId>();
  for (const d of DEPARTMENTS) {
    const doc = await Dept.findOneAndUpdate(
      { cabinetPeriod: cabinetId, slug: d.slug },
      { $setOnInsert: { ...d, cabinetPeriod: cabinetId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    deptMap.set(d.slug, doc._id as mongoose.Types.ObjectId);
    console.log(`   ✓ ${d.name} (${d.slug})`);
  }

  // 4. Upsert users
  console.log('\n📌 Ensuring test users...');
  for (const u of TEST_USERS) {
    const roleId = roleMap.get(u.roleSlug);
    if (!roleId) { console.log(`   ✗ Role "${u.roleSlug}" not found, skipping ${u.email}`); continue; }

    const update: Record<string, any> = {
      name: u.name,
      role: roleId,
      cabinetPeriod: cabinetId,
      position: u.position,
      isActive: true,
    };
    if (u.departmentSlug) {
      update.department = deptMap.get(u.departmentSlug);
    }

    const existing = await User.findOne({ email: u.email });
    if (existing) {
      // Update role, department, name, etc. but don't overwrite googleId
      await User.updateOne({ email: u.email }, { $set: update });
      console.log(`   ✓ Updated: ${u.name} <${u.email}> → ${u.roleSlug}`);
    } else {
      await User.create({
        ...update,
        email: u.email,
        googleId: `bypass-seed-${u.roleSlug}-${Date.now()}`,
      });
      console.log(`   ✓ Created: ${u.name} <${u.email}> → ${u.roleSlug}`);
    }
  }

  console.log('\n✅ Seed complete!\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
