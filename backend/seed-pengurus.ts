import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemft-cms';
const CABINET_PERIOD = 'Danadyaksa 2026';

// ---------------------------------------------------------
// SKEMA
// ---------------------------------------------------------

const RoleSchema = new mongoose.Schema({
  name: String,
  slug: String,
  scope: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
}, { timestamps: true });

const DepartmentSchema = new mongoose.Schema({
  name: String,
  slug: String,
  code: String,
  description: String,
  isActive: { type: Boolean, default: true },
  order: Number,
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  nim: String,
  cabinetPeriod: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  position: String,
  isActive: { type: Boolean, default: true },
  avatar: String,
  publicPhoto: String,
}, { timestamps: true });

async function seedData() {
  console.log(`🌱 Connecting to MongoDB: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.');

  const RoleModel = mongoose.model('Role', RoleSchema);
  const DepartmentModel = mongoose.model('Department', DepartmentSchema);
  const UserModel = mongoose.model('User', UserSchema);

  // 1. CLEAR EXISTING DATA (USERS & DEPARTMENTS ONLY - KEEP PERMISSIONS/ROLES)
  console.log('\n🧹 Clearing old users and departments...');
  await UserModel.deleteMany({});
  await DepartmentModel.deleteMany({});
  console.log('✅ Old users and departments cleared.');

  // 2. ENSURE BASE ROLES EXIST
  console.log('\n🛡️ Ensuring base roles exist...');
  const baseRoles = [
    { name: 'Super Admin', slug: 'super-admin', scope: 'global' },
    { name: 'Ketua BEM', slug: 'kabem', scope: 'global' },
    { name: 'Wakil Ketua BEM', slug: 'wakabem', scope: 'global' },
    { name: 'Sekretaris', slug: 'sekretaris', scope: 'global' },
    { name: 'Bendahara', slug: 'bendahara', scope: 'global' },
    { name: 'Kepala Departemen', slug: 'kadep', scope: 'department' },
    { name: 'Wakil Kepala Departemen', slug: 'wakadep', scope: 'department' },
    { name: 'Staf Divisi', slug: 'staf', scope: 'department' },
  ];

  const roleMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const r of baseRoles) {
    let role = await RoleModel.findOne({ slug: r.slug });
    if (!role) {
      role = await RoleModel.create(r);
    }
    roleMap[r.slug] = role._id as mongoose.Types.ObjectId;
  }
  console.log('✅ Roles prepared.');

  // 3. SEED DEPARTMENTS
  console.log('\n🏢 Seeding departments...');
  const deptData = [
    { name: 'Aksi Strategi dan Narasi', slug: 'kastrat', code: 'KST', order: 1 },
    { name: 'Advokasi Mahasiswa', slug: 'advokasi', code: 'ADV', order: 2 },
    { name: 'Ekonomi Kreatif', slug: 'ekraf', code: 'EKR', order: 3 },
    { name: 'Sosial dan Pengabdian', slug: 'sospeng', code: 'SOS', order: 4 },
    { name: 'Komunikasi dan Media Informasi', slug: 'kominfo', code: 'KMF', order: 5 },
    { name: 'Dalam Negeri', slug: 'dagri', code: 'DGN', order: 6 },
    { name: 'Seni dan Olahraga', slug: 'senor', code: 'SNO', order: 7 },
    { name: 'Riset dan Teknologi', slug: 'ristek', code: 'RST', order: 8 },
    { name: 'Luar Negeri', slug: 'lugri', code: 'LGN', order: 9 },
  ];

  const deptMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const d of deptData) {
    const dept = await DepartmentModel.create(d);
    deptMap[d.name] = dept._id as mongoose.Types.ObjectId;
  }
  console.log(`✅ ${Object.keys(deptMap).length} departments created.`);

  // 4. PREPARE USER DATA
  console.log('\n👥 Seeding users...');
  const usersToInsert: Record<string, unknown>[] = [];

  const addUser = (name: string, nim: string, roleSlug: string, position: string, deptName: string | null = null, publicPhotoUrl: string = '', customEmail?: string) => {
    // Check for duplicate NIM in this run to avoid dupes
    if (usersToInsert.some(u => u.nim === nim)) {
      console.warn(`[WARN] Skipping duplicate NIM: ${nim} (${name})`);
      return;
    }
    const email = customEmail || `${nim}@mhs.unesa.ac.id`;
    usersToInsert.push({
      name,
      nim,
      email,
      cabinetPeriod: CABINET_PERIOD,
      role: roleMap[roleSlug],
      department: deptName ? deptMap[deptName] : null,
      position,
      isActive: true,
      publicPhoto: publicPhotoUrl
    });
  };

  // --- PIMPINAN HARIAN (7 Orang) ---
  addUser('Super Administrator', '00000000000', 'super-admin', 'Super Admin', null, '', 'bemft@unesa.ac.id');
  addUser('Diha Anfeu Nio Julaynda', '23051204212', 'kabem', 'Ketua BEM', null, '/fungsionaris/Diha Anfeu Nio Julaynda.png');
  addUser('Syahrul Fath', '23050534095', 'wakabem', 'Wakil Ketua BEM', null, '/fungsionaris/Syahrul Fath.png');
  addUser('Muhammad Hanif Fayshol', '23051204298', 'sekretaris', 'Sekretaris Umum');
  addUser('Tiara Zahrofi Ifadhah', '25051204303', 'sekretaris', 'Sekretaris Administrasi');
  addUser('M. Fahad Hukma Ridho', '23051204286', 'sekretaris', 'Sekretaris Kegiatan');
  addUser('Elok Faiqoh', '23051204291', 'bendahara', 'Bendahara Umum', null, '/fungsionaris/Elok Faiqoh.png');
  addUser('Stefi Febianova', '24051204166', 'bendahara', 'Bendahara Kegiatan', null, '/fungsionaris/Stefi Febianova.png');

  // --- Aksi Strategi dan Narasi (7 Orang) ---
  let dName = 'Aksi Strategi dan Narasi';
  addUser("Ahad Mu'adhim", '23051214228', 'kadep', 'Ketua Departemen', dName);
  addUser('Kevin Eka Putra', '23050724243', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Ahmad Dziqro Attayyu Setio Damar', '25050974129', 'staf', 'Staf', dName);
  addUser('Rafisyah Majid M', '24050724099', 'staf', 'Staf', dName);
  addUser('Aqila Zafira Narlisnda', '24050394162', 'staf', 'Staf', dName);
  addUser('Fishabela Agustin', '25050974127', 'staf', 'Staf', dName);
  addUser('Muhammad Husein Al-Jabbar', '23051204303', 'staf', 'Staf', dName); // Note: 23051204303 NIM collision possible if Tiara is 25051204303? Wait, they are distinct.

  // --- Advokasi Mahasiswa (7 Orang) ---
  dName = 'Advokasi Mahasiswa';
  addUser('Ahmad Enggra Resmono', '24050974155', 'kadep', 'Ketua Departemen', dName);
  addUser('Shintya Clara Damanik', '24050404064', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Dian Anggraini Adha', '24050634070', 'staf', 'Staf', dName);
  addUser('Fani Nur Afiah Ningsih', '25050394150', 'staf', 'Staf', dName);
  addUser('Muhammad Hamdani', '25051214171', 'staf', 'Staf', dName);
  addUser('Shofiatus Sholeha', '24050404106', 'staf', 'Staf', dName);
  addUser('Handalinda Poan Rofiqoh', '25050404061', 'staf', 'Staf', dName);

  // --- Ekonomi Kreatif (8 Orang) ---
  dName = 'Ekonomi Kreatif';
  addUser('Muhammad Fazattaqwa', '23051204240', 'kadep', 'Ketua Departemen', dName);
  addUser('Ahmad Falasifa', '23050724246', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Velanisa Luthfiana', '25051204025', 'staf', 'Staf', dName);
  addUser('Abdi Fysabilillah', '24051204059', 'staf', 'Staf', dName);
  addUser('Muhammad Magfur Arifin', '25050974021', 'staf', 'Staf', dName);
  addUser('Azizah Tuzzaroh', '25050404146', 'staf', 'Staf', dName);
  addUser('Aghata Virlina Veymei Layta', '24050724273', 'staf', 'Staf', dName);
  addUser('Muhammad Hasan Apini Maulana', '24051204159', 'staf', 'Staf', dName);

  // --- Sosial dan Pengabdian (7 Orang) ---
  dName = 'Sosial dan Pengabdian';
  addUser('Andika Kristian Sunaryo', '23050514073', 'kadep', 'Ketua Departemen', dName);
  addUser('Unaisah Dzattu Ikhtisamah', '24050974097', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser("Ibnu Is'af Adibrata", '24050754135', 'staf', 'Staf', dName);
  addUser('Kalila Yasmine Kartika Arief', '25051214015', 'staf', 'Staf', dName);
  addUser('Nabila Putri Luthfiyyah', '25051874144', 'staf', 'Staf', dName);
  addUser('Keisa Aushafa Dzihni', '25051204339', 'staf', 'Staf', dName);
  addUser('Muh. Mahendra Arif Nazarudin', '24050874188', 'staf', 'Staf', dName);

  // --- Komunikasi dan Media Informasi (8 Orang) ---
  dName = 'Komunikasi dan Media Informasi';
  addUser('Herdina Agnes P', '24051214174', 'kadep', 'Ketua Departemen', dName);
  addUser('Ahmad Arkanul F', '24051204033', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Adzwa Izzaz Syah Putri', '23051204215', 'staf', 'Staf', dName);
  addUser('Dwika Wijaya Ardana', '24051214161', 'staf', 'Staf', dName);
  addUser('Faiz Ahmad Dien Al-Ghifary', '25051204295', 'staf', 'Staf', dName);
  addUser('Geovandre Dalton Christonouviere Lo', '25050724220', 'staf', 'Staf', dName);
  addUser('Savannah Farah', '24051214242', 'staf', 'Staf', dName);
  addUser('Azidni Taftazani Amirullah Ichsan', '25050974040', 'staf', 'Staf', dName);

  // --- Dalam Negeri (8 Orang) ---
  dName = 'Dalam Negeri';
  addUser('Nadila Yuanoka Maharani', '23050534028', 'kadep', 'Ketua Departemen', dName);
  addUser('Aditya Putra Wicaksana', '25051204384', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Amira Nahda Zhafirah Baay', '25051204111', 'staf', 'Staf', dName);
  addUser('Riski Rahmattillah Pratama', '25051204338', 'staf', 'Staf', dName);
  addUser('Pink Brilliant Sifana', '24050404013', 'staf', 'Staf', dName);
  addUser('Revangga Ainur Hidayah', '24050534026', 'staf', 'Staf', dName);
  addUser('Ken Revansyah', '24050874178', 'staf', 'Staf', dName);
  addUser('Muhammad Hafizh Shafa Rabbani', '25051204269', 'staf', 'Staf', dName);

  // --- Seni dan Olahraga (9 Orang) ---
  dName = 'Seni dan Olahraga';
  addUser('Farhan Kirana', '23050724082', 'kadep', 'Ketua Departemen', dName);
  addUser('Diah Agustina Wigatisari', '24050394166', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Arya Rajendra Utomo', '24050724260', 'staf', 'Staf', dName);
  addUser('Royhan Balqis Amaludin', '24050874012', 'staf', 'Staf', dName);
  addUser('Muhammad Rizki Alfareza', '24050724225', 'staf', 'Staf', dName);
  addUser('Ikfi Ardani Kharisma', '24051214165', 'staf', 'Staf', dName);
  addUser('Rehil Azrilla Multajabah', '25051204065', 'staf', 'Staf', dName);
  addUser('Saskia Widya Aini', '24050974108', 'staf', 'Staf', dName);
  addUser('Gisella Gitafrea Rista Irawan', '24050634028', 'staf', 'Staf', dName);

  // --- Riset dan Teknologi (8 Orang) ---
  dName = 'Riset dan Teknologi';
  addUser('Yonathan Budi Satrio', '23050724280', 'kadep', 'Ketua Departemen', dName);
  addUser('Maulana Ardhiansyah Prasetyo', '23051204300', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser("Muhammad 'Atho'illah", '25051214118', 'staf', 'Staf', dName);
  addUser('Hasna Dwi Febrina', '23050404189', 'staf', 'Staf', dName);
  addUser('Sidqiana Azzahra', '25051204037', 'staf', 'Staf', dName);
  addUser('Aliya Shafia', '25051204200', 'staf', 'Staf', dName);
  addUser('Any Aulia Putri', '25051204228', 'staf', 'Staf', dName);
  addUser('Yohana Noviyanti Sianipar', '24051214002', 'staf', 'Staf', dName);

  // --- Luar Negeri (8 Orang) ---
  dName = 'Luar Negeri';
  addUser('Moh. Ibnu Kandiyas', '23051204293', 'kadep', 'Ketua Departemen', dName);
  addUser('Shabrinada Wibisono', '24051874026', 'wakadep', 'Wakil Ketua Departemen', dName);
  addUser('Naufal Athallahraid Syahari', '25051214129', 'staf', 'Staf', dName);
  addUser('Brilliant Adam Awwaluddin Shonif', '25051214133', 'staf', 'Staf', dName);
  addUser('Agri Azzukhruf', '24051204085', 'staf', 'Staf', dName);
  addUser('Laura Dea Stefy', '23050514084', 'staf', 'Staf', dName);
  addUser('Fitria Nadzirah Ardani', '25051874052', 'staf', 'Staf', dName);
  addUser('Jessica Victoria Avianti', '23050394031', 'staf', 'Staf', dName);

  // INSERT ALL
  await UserModel.insertMany(usersToInsert);
  console.log(`✅ ${usersToInsert.length} users successfully seeded!`);

  console.log('\n🎉 ALL DONE! You can now start the application.');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('❌ SEED ERROR:', err);
  process.exit(1);
});