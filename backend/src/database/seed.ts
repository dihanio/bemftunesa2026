import mongoose, { Types } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  User,
  Department,
  Article,
  Aspiration,
  GalleryAlbum,
  GalleryPhoto,
  Proker,
  Event,
  Product,
  PKKMBConfig,
  PKKMBSchedule,
  SiteSetting,
} from './schema';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemft_db';

function normalizeSeedRole(role: string): string {
  switch (role) {
    case 'Ketua BEM':
    case 'Wakil Ketua BEM':
      return 'Super Admin';
    case 'Sekretaris Umum':
    case 'Sekretaris Kegiatan 1':
    case 'Sekretaris Kegiatan 2':
      return 'Sekretaris';
    case 'Bendahara Umum':
    case 'Bendahara Kegiatan':
      return 'Bendahara';
    case 'Kepala Departemen':
      return 'Kadep';
    case 'Wakil Kepala Departemen':
      return 'Wakadep';
    case 'Staf':
      return 'Staff';
    default:
      return role;
  }
}

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing data
    await mongoose.connection.db?.dropDatabase();
    console.log('🗑️ Database cleared (dropped)');

    // 2. Seed Site Settings
    await mongoose.connection.collection('sitesettings').insertMany([
      { key: 'site_name', value: 'BEM FT UNESA 2026', type: 'string' },
      { key: 'cabinet_name', value: 'Danadyaksa', type: 'string' },
      { key: 'cabinet_year', value: '2026', type: 'string' },
      { key: 'maintenance_mode', value: false, type: 'boolean' },
    ]);

    // 3. Seed Departments (Danadyaksa 2026 - Excluding BPI as it's not a department)
    const depts = [
      {
        name: 'Dalam Negeri',
        code: 'DAGRI',
        description: 'Internal organisasi dan harmonisasi Ormawa FT',
        slug: 'dagri',
      },
      {
        name: 'Luar Negeri',
        code: 'DEPLU',
        description: 'Hubungan eksternal dan perluasan jaringan',
        slug: 'deplu',
      },
      {
        name: 'Advokasi Mahasiswa',
        code: 'ADVOKASI',
        description: 'Pelayanan aspirasi dan kesejahteraan mahasiswa',
        slug: 'advokasi',
      },
      {
        name: 'Riset dan Teknologi',
        code: 'RISTEK',
        description: 'Pengembangan riset dan inovasi teknologi',
        slug: 'ristek',
      },
      {
        name: 'Komunikasi, Media, dan Informasi',
        code: 'KOMINFO',
        description: 'Branding, publikasi digital, dan pengelolaan media',
        slug: 'kominfo',
      },
      {
        name: 'Aksi Strategis dan Narasi',
        code: 'ASNAR',
        description: 'Kajian isu strategis dan gerakan mahasiswa',
        slug: 'asnar',
      },
      {
        name: 'Sosial dan Pengabdian',
        code: 'SOSPEN',
        description: 'Pengabdian masyarakat dan aksi sosial',
        slug: 'sospen',
      },
      {
        name: 'Ekonomi Kreatif',
        code: 'EKRAF',
        description: 'Pemberdayaan ekonomi dan kewirausahaan',
        slug: 'ekraf',
      },
      {
        name: 'Seni dan Olahraga',
        code: 'SENIOR',
        description: 'Pengembangan minat bakat seni dan olahraga',
        slug: 'senior',
      },
    ];
    const createdDepts = await mongoose.connection
      .collection('departments')
      .insertMany(depts);
    const deptIds = Object.values(createdDepts.insertedIds);
    console.log(`🏢 Seeded ${deptIds.length} departments`);

    // 4. Seed Users (Complete Danadyaksa 2026 based on Official SK)
    const rawUsers = [
      // BPI (Logical Separation: No Department ID)
      {
        name: 'Diha Anfeu Nio Julaynda',
        nim: '23051204212',
        role: 'Ketua BEM',
        departmentId: null,
        avatar: '/fungsionaris/Diha Anfeu Nio Julaynda.png',
      },
      {
        name: 'Syahrul Fath',
        nim: '23050534095',
        role: 'Wakil Ketua BEM',
        departmentId: null,
        avatar: '/fungsionaris/Syahrul Fath.png',
      },
      {
        name: 'Muhammad Hanif Fayshol',
        nim: '23051204298',
        role: 'Sekretaris Umum',
        departmentId: null,
      },
      {
        name: 'M. Fahad Hukma Ridho',
        nim: '23051204286',
        role: 'Sekretaris Kegiatan 1',
        departmentId: null,
      },
      {
        name: 'Tiara Zahrofi Ifadhah',
        nim: '25051204303',
        role: 'Sekretaris Kegiatan 2',
        departmentId: null,
      },
      {
        name: 'Elok Faiqoh',
        nim: '23051204291',
        role: 'Bendahara Umum',
        departmentId: null,
        avatar: '/fungsionaris/Elok Faiqoh.png',
      },
      {
        name: 'Stefi Febianova',
        nim: '24051204166',
        role: 'Bendahara Kegiatan',
        departmentId: null,
        avatar: '/fungsionaris/Stefi Febianova.png',
      },

      // DAGRI
      {
        name: 'Nadila Yuanoka Maharani',
        nim: '23050534028',
        role: 'Kepala Departemen',
        departmentId: deptIds[0],
      },
      {
        name: 'Aditya Putra Wicaksana',
        nim: '25051204384',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[0],
      },
      {
        name: 'Amira Nahda Zhafirah Baay',
        nim: '25051204111',
        role: 'Staf',
        departmentId: deptIds[0],
      },
      {
        name: 'Riski Rahmattillah Pratama',
        nim: '25051204338',
        role: 'Staf',
        departmentId: deptIds[0],
      },
      {
        name: 'Pink Brilliant Sifana',
        nim: '24050404013',
        role: 'Staf',
        departmentId: deptIds[0],
      },
      {
        name: 'Revangga Ainur Hidayah',
        nim: '24050534026',
        role: 'Staf',
        departmentId: deptIds[0],
      },
      {
        name: 'Ken Revansyah',
        nim: '24050874178',
        role: 'Staf',
        departmentId: deptIds[0],
      },
      {
        name: 'Ahmad Hamam',
        nim: '24050874179',
        role: 'Staf',
        departmentId: deptIds[0],
      },

      // DEPLU
      {
        name: 'Moh. Ibnu Kandiyas',
        nim: '23051204293',
        role: 'Kepala Departemen',
        departmentId: deptIds[1],
      },
      {
        name: 'Shabrinada Wibisono',
        nim: '24051874026',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[1],
      },
      {
        name: 'Naufal Athallahraid Syahari',
        nim: '25051214129',
        role: 'Staf',
        departmentId: deptIds[1],
      },
      {
        name: 'Brilliant Adam Awwaluddin Shonif',
        nim: '25051214133',
        role: 'Staf',
        departmentId: deptIds[1],
      },
      {
        name: 'Agri Azzukhruf',
        nim: '24051204085',
        role: 'Staf',
        departmentId: deptIds[1],
      },
      {
        name: 'Laura Dea Stefy',
        nim: '23050514084',
        role: 'Staf',
        departmentId: deptIds[1],
      },
      {
        name: 'Fitria Nadzirah Ardani',
        nim: '25051874052',
        role: 'Staf',
        departmentId: deptIds[1],
      },
      {
        name: 'Jessica Victoria Avianti',
        nim: '23050394031',
        role: 'Staf',
        departmentId: deptIds[1],
      },

      // ADVOKASI
      {
        name: 'Ahmad Enggra Resmono',
        nim: '24050974155',
        role: 'Kepala Departemen',
        departmentId: deptIds[2],
      },
      {
        name: 'Shintya Clara Damanik',
        nim: '24050404064',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[2],
      },
      {
        name: 'Dian Anggraini Adha',
        nim: '24050634070',
        role: 'Staf',
        departmentId: deptIds[2],
      },
      {
        name: 'Fani Nur Afiah Ningsih',
        nim: '25050394150',
        role: 'Staf',
        departmentId: deptIds[2],
      },
      {
        name: 'Muhammad Hamdani',
        nim: '25051214171',
        role: 'Staf',
        departmentId: deptIds[2],
      },
      {
        name: 'Shofiatus Sholeha',
        nim: '24050404106',
        role: 'Staf',
        departmentId: deptIds[2],
      },
      {
        name: 'Handalinda Poan Rofiqoh Wahidah',
        nim: '25050404061',
        role: 'Staf',
        departmentId: deptIds[2],
      },

      // RISTEK (Riset dan Teknologi)
      {
        name: 'Yonathan Budi Satrio',
        nim: '23050724280',
        role: 'Kepala Departemen',
        departmentId: deptIds[3],
      },
      {
        name: 'Maulana Ardhiansyah Prasetyo',
        nim: '23051204300',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[3],
      },
      {
        name: 'Muhammad ‘Atho’illah',
        nim: '25051214118',
        role: 'Staf',
        departmentId: deptIds[3],
      },
      {
        name: 'Hasna Dwi Febrina',
        nim: '23050404189',
        role: 'Staf',
        departmentId: deptIds[3],
      },
      {
        name: 'Sidqiana Azzahra',
        nim: '25051204037',
        role: 'Staf',
        departmentId: deptIds[3],
      },
      {
        name: 'Aliya Shafia',
        nim: '25051204200',
        role: 'Staf',
        departmentId: deptIds[3],
      },
      {
        name: 'Any Aulia Putri',
        nim: '25051204228',
        role: 'Staf',
        departmentId: deptIds[3],
      },
      {
        name: 'Yohana Noviyanti Sianipar',
        nim: '24051214002',
        role: 'Staf',
        departmentId: deptIds[3],
      },

      // KOMINFO
      {
        name: 'Herdina Agnes P',
        nim: '24051214174',
        role: 'Kepala Departemen',
        departmentId: deptIds[4],
      },
      {
        name: 'Ahmad Arkanul F',
        nim: '24051204033',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[4],
      },
      {
        name: 'Adzwa Izzaz Syah Putri',
        nim: '23051204215',
        role: 'Staf',
        departmentId: deptIds[4],
      },
      {
        name: 'Dwika Wijaya Ardana',
        nim: '24051214161',
        role: 'Staf',
        departmentId: deptIds[4],
      },
      {
        name: 'Faiz Ahmad Dien Al-Ghifary',
        nim: '25051204295',
        role: 'Staf',
        departmentId: deptIds[4],
      },
      {
        name: 'Geovandre Dalton C. L',
        nim: '25050724220',
        role: 'Staf',
        departmentId: deptIds[4],
      },
      {
        name: 'Savannah Farah',
        nim: '24051214242',
        role: 'Staf',
        departmentId: deptIds[4],
      },
      {
        name: 'Azidni Taftazani Amirullah',
        nim: '25050974040',
        role: 'Staf',
        departmentId: deptIds[4],
      },

      // ASNAR
      {
        name: "Ahad Mu'adhim",
        nim: '23051214228',
        role: 'Kepala Departemen',
        departmentId: deptIds[5],
      },
      {
        name: 'Kevin Eka Putra',
        nim: '23050724243',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[5],
      },
      {
        name: 'Ahmad Dziqro Attayyu Setio D',
        nim: '25050974129',
        role: 'Staf',
        departmentId: deptIds[5],
      },
      {
        name: 'Rafisyah Majid M',
        nim: '24050724099',
        role: 'Staf',
        departmentId: deptIds[5],
      },
      {
        name: 'Aqila Zafira Narlisnda',
        nim: '24050394162',
        role: 'Staf',
        departmentId: deptIds[5],
      },
      {
        name: 'Fishabela Agustin',
        nim: '25050974127',
        role: 'Staf',
        departmentId: deptIds[5],
      },
      {
        name: 'Muhammad Husein Al-Jabbar',
        nim: '23051204303',
        role: 'Staf',
        departmentId: deptIds[5],
      },

      // SOSPEN
      {
        name: 'Andika Kristian Sunaryo',
        nim: '23050514073',
        role: 'Kepala Departemen',
        departmentId: deptIds[6],
      },
      {
        name: 'Unaisah Dzattu Ikhtisamah',
        nim: '24050974097',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[6],
      },
      {
        name: "Ibnu Is'af Adibrata",
        nim: '24050754135',
        role: 'Staf',
        departmentId: deptIds[6],
      },
      {
        name: 'Kalila Yasmine Kartika Arief',
        nim: '25051214015',
        role: 'Staf',
        departmentId: deptIds[6],
      },
      {
        name: 'Nabila Putri Luthfiyyah',
        nim: '25051874144',
        role: 'Staf',
        departmentId: deptIds[6],
      },
      {
        name: 'Keisa Aushafa Dzihni',
        nim: '25051204339',
        role: 'Staf',
        departmentId: deptIds[6],
      },
      {
        name: 'Muh. Mahendra Arif N',
        nim: '24050874188',
        role: 'Staf',
        departmentId: deptIds[6],
      },

      // EKRAF
      {
        name: 'Muhammad Fazattaqwa',
        nim: '23051204240',
        role: 'Kepala Departemen',
        departmentId: deptIds[7],
      },
      {
        name: 'Ahmad Falasifa',
        nim: '23050724246',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[7],
      },
      {
        name: 'Velanisa Luthfiana',
        nim: '25051204025',
        role: 'Staf',
        departmentId: deptIds[7],
      },
      {
        name: 'Abdi Fysabilillah',
        nim: '24051204059',
        role: 'Staf',
        departmentId: deptIds[7],
      },
      {
        name: 'Muhammad Magfur Arifin',
        nim: '25050974021',
        role: 'Staf',
        departmentId: deptIds[7],
      },
      {
        name: 'Azizah Tuzzaroh',
        nim: '25050404146',
        role: 'Staf',
        departmentId: deptIds[7],
      },
      {
        name: 'Aghata Virlina Veymei Layta',
        nim: '24050724273',
        role: 'Staf',
        departmentId: deptIds[7],
      },
      {
        name: 'Muhammad Hasan Apini',
        nim: '24051204159',
        role: 'Staf',
        departmentId: deptIds[7],
      },

      // SENIOR
      {
        name: 'Farhan Kirana',
        nim: '23050724082',
        role: 'Kepala Departemen',
        departmentId: deptIds[8],
      },
      {
        name: 'Diah Agustina Wigatisari',
        nim: '24050394166',
        role: 'Wakil Kepala Departemen',
        departmentId: deptIds[8],
      },
      {
        name: 'Arya Rajendra Utomo',
        nim: '24050724260',
        role: 'Staf',
        departmentId: deptIds[8],
      },
      {
        name: 'Royhan Balqis Amaludin',
        nim: '24050874012',
        role: 'Staf',
        departmentId: deptIds[8],
      },
      {
        name: 'Muhammad Rizki Alfareza',
        nim: '24050724225',
        role: 'Staf',
        departmentId: deptIds[8],
      },
      {
        name: 'Ikfi Ardani Kharisma',
        nim: '24051214165',
        role: 'Staf',
        departmentId: deptIds[8],
      },
      {
        name: 'Rehil Azrilla Multajabah',
        nim: '25051204065',
        role: 'Staf',
        departmentId: deptIds[8],
      },
      {
        name: 'Saskia Widya Aini',
        nim: '24050974108',
        role: 'Staf',
        departmentId: deptIds[8],
      },
      {
        name: 'Gisella Gitafrea Rista Irawan',
        nim: '24050634028',
        role: 'Staf',
        departmentId: deptIds[8],
      },
    ];

    const users = rawUsers.map((u) => ({
      ...u,
      role: normalizeSeedRole(u.role),
      email:
        u.nim === '23051204212'
          ? 'diha.23212@mhs.unesa.ac.id'
          : `${u.nim}@mhs.unesa.ac.id`,
      isActive: true,
    }));

    // Inject Admin Sistem Account
    users.push({
      name: 'System Administrator',
      nim: '00000000000',
      role: 'Admin Sistem',
      email: 'bemft@unesa.ac.id',
      isActive: true,
    } as any);

    const createdUsers = await mongoose.connection
      .collection('users')
      .insertMany(users);
    const userIds = rawUsers.map((_, index) => createdUsers.insertedIds[index]);
    console.log(`👥 Seeded ${userIds.length} users`);

    const departmentHeadUpdates = rawUsers
      .map((user, index) => {
        if (
          user.role !== 'Kepala Departemen' ||
          !user.departmentId ||
          !userIds[index]
        ) {
          return null;
        }

        return {
          updateOne: {
            filter: { _id: user.departmentId },
            update: { $set: { headId: userIds[index] } },
          },
        };
      })
      .filter(
        (
          operation,
        ): operation is {
          updateOne: {
            filter: { _id: mongoose.mongo.BSON.ObjectId };
            update: { $set: { headId: mongoose.mongo.BSON.ObjectId } };
          };
        } => operation !== null,
      );

    if (departmentHeadUpdates.length > 0) {
      await mongoose.connection
        .collection('departments')
        .bulkWrite(departmentHeadUpdates);
    }

    // 5. Seed Articles
    const articles = [
      {
        title:
          'BEM FT UNESA Gelar LKM-TD 2026: Membangun Jiwa Kepemimpinan Inovatif',
        slug: 'lkm-td-2026-membangun-jiwa-kepemimpinan',
        content:
          'Kegiatan LKM-TD tahun ini mengusung tema "Engineering Leadership in Gen-AI Era". Diikuti oleh lebih dari 200 mahasiswa baru dari seluruh jurusan di Fakultas Teknik...',
        category: 'Kegiatan',
        status: 'Published',
        authorId: userIds[0],
        tags: ['LKM-TD', 'Kaderisasi', 'Leadership'],
        thumbnailUrl:
          'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=1000',
      },
      {
        title: 'Pengumuman: Jadwal Matrikulasi PKKMB FT 2026',
        slug: 'jadwal-matrikulasi-pkkmb-ft-2026',
        content:
          'Diberitahukan kepada seluruh mahasiswa baru angkatan 2026, matrikulasi akan dilaksanakan pada tanggal 20-22 Agustus 2026. Persiapkan perlengkapan sesuai buku panduan...',
        category: 'Pengumuman',
        status: 'Published',
        authorId: userIds[1],
        tags: ['PKKMB', 'Maba', 'UNESA'],
        thumbnailUrl:
          'https://images.unsplash.com/photo-1523050853064-074f09d564fa?auto=format&fit=crop&q=80&w=1000',
      },
    ];
    await mongoose.connection.collection('articles').insertMany(articles);
    console.log('📝 Seeded articles');

    // 6. Seed Proker
    const prokers = [
      {
        title:
          'LKM-TD (Latihan Keterampilan Manajemen Mahasiswa Tingkat Dasar)',
        slug: 'lkm-td-2026',
        description:
          'Pelatihan kepemimpinan dasar bagi mahasiswa tingkat pertama.',
        departmentId: deptIds[0],
        status: 'In Progress',
        progress: 60,
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-17'),
        location: 'Gedung E1 FT UNESA',
        budget: 5000000,
      },
      {
        title: 'Engineering Cup 2026',
        slug: 'engineering-cup-2026',
        description: 'Turnamen olahraga antar jurusan di Fakultas Teknik.',
        departmentId: deptIds[8],
        status: 'Planning',
        progress: 10,
        startDate: new Date('2026-09-10'),
        endDate: new Date('2026-09-25'),
        location: 'Lapangan Gelora FT UNESA',
        budget: 15000000,
      },
    ];
    await mongoose.connection.collection('prokers').insertMany(prokers);
    console.log('🚀 Seeded proker');

    // 7. Seed Shop
    const products = [
      {
        name: 'Hoodie BEM FT 2026 - Navy Edition',
        slug: 'hoodie-bem-ft-2026-navy',
        description:
          'Hoodie resmi Kabinet Danadyaksa 2026. Bahan cotton fleece premium.',
        price: 150000,
        stock: 50,
        status: 'active',
        category: 'Apparel',
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1000',
        ],
      },
    ];
    await mongoose.connection.collection('products').insertMany(products);
    console.log('🛒 Seeded shop products');

    // 8. Seed PKKMB
    await mongoose.connection.collection('pkkmbschedules').insertMany([
      {
        day: 1,
        title: 'Pembukaan & Inagurasi',
        startTime: new Date('2026-08-25T07:00:00'),
        location: 'Gedung G3 FT',
        speaker: 'Dekan FT',
      },
    ]);
    console.log('🎓 Seeded PKKMB schedule');

    // 9. Seed Events
    const events = [
      {
        title: 'Rapat Koordinasi Pleno Tengah Tahun BEM FT UNESA',
        description:
          'Evaluasi program kerja tengah tahun dan koordinasi internal kabinet.',
        startTime: new Date('2026-06-02T13:00:00'),
        endTime: new Date('2026-06-02T17:00:00'),
        location: 'Ruang Sidang Lt.2 Dekanat FT UNESA',
        organizerDeptId: deptIds[0],
        isPublic: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Sosialisasi PKKMB FT UNESA 2026',
        description:
          'Pemaparan alur pelaksanaan PKKMB tingkat Fakultas Teknik kepada calon panitia.',
        startTime: new Date('2026-06-10T09:00:00'),
        endTime: new Date('2026-06-10T12:00:00'),
        location: 'Audit Gedung E1 FT UNESA',
        organizerDeptId: deptIds[0],
        isPublic: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Technical Meeting LKM-TD 2026',
        description:
          'Penjelasan tata tertib dan pembagian kelompok bagi seluruh peserta LKM-TD.',
        startTime: new Date('2026-06-13T08:00:00'),
        endTime: new Date('2026-06-13T12:00:00'),
        location: 'Gedung G3 FT UNESA',
        organizerDeptId: deptIds[0],
        isPublic: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Rapat Evaluasi Akbar Kegiatan Kaderisasi',
        description:
          'Tinjauan kritis hasil pelaksanaan LKM-TD 2026 dan perbaikan ke depan.',
        startTime: new Date('2026-06-20T10:00:00'),
        endTime: new Date('2026-06-20T15:00:00'),
        location: 'Co-Working Space FT UNESA',
        organizerDeptId: deptIds[0],
        isPublic: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Fakultas Teknik Bersholawat 2026',
        description:
          'Gema sholawat bersama seluruh civitas akademika Fakultas Teknik UNESA.',
        startTime: new Date('2026-06-25T18:30:00'),
        endTime: new Date('2026-06-25T22:30:00'),
        location: 'Halaman Depan Dekanat FT UNESA',
        organizerDeptId: deptIds[6],
        isPublic: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await mongoose.connection.collection('events').insertMany(events);
    console.log('📅 Seeded events');

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
