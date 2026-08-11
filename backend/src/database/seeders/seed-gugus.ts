import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

const RUMPUN_DATA = [
  { name: 'Rumpun Teknik Mesin', color: '#EF4444', icon: 'Cog', order: 1 },
  { name: 'Rumpun Teknik Elektro', color: '#F59E0B', icon: 'Zap', order: 2 },
  {
    name: 'Rumpun Teknik Informatika',
    color: '#3B82F6',
    icon: 'Code',
    order: 3,
  },
  { name: 'Rumpun Teknik Sipil', color: '#10B981', icon: 'Building', order: 4 },
  { name: 'Rumpun PKK', color: '#EC4899', icon: 'Heart', order: 5 },
];

const STUDY_PROGRAMS_DATA = [
  // Rumpun Teknik Mesin
  {
    code: 'S1-PTM',
    name: 'S1 Pendidikan Teknik Mesin',
    rumpunName: 'Rumpun Teknik Mesin',
    degree: 'S1',
  },
  {
    code: 'S1-PVTO',
    name: 'S1 Pendidikan Vokasional Teknologi Otomotif',
    rumpunName: 'Rumpun Teknik Mesin',
    degree: 'S1',
  },
  {
    code: 'S1-TM',
    name: 'S1 Teknik Mesin',
    rumpunName: 'Rumpun Teknik Mesin',
    degree: 'S1',
  },
  {
    code: 'S1-TMT',
    name: 'S1 Teknik Metalurgi',
    rumpunName: 'Rumpun Teknik Mesin',
    degree: 'S1',
  },
  {
    code: 'S1-TP',
    name: 'S1 Teknik Pertambangan',
    rumpunName: 'Rumpun Teknik Mesin',
    degree: 'S1',
  },

  // Rumpun Teknik Elektro
  {
    code: 'S1-PTE',
    name: 'S1 Pendidikan Teknik Elektro',
    rumpunName: 'Rumpun Teknik Elektro',
    degree: 'S1',
  },
  {
    code: 'S1-TE',
    name: 'S1 Teknik Elektro',
    rumpunName: 'Rumpun Teknik Elektro',
    degree: 'S1',
  },

  // Rumpun Teknik Informatika
  {
    code: 'S1-PTI',
    name: 'S1 Pendidikan Teknologi Informasi',
    rumpunName: 'Rumpun Teknik Informatika',
    degree: 'S1',
  },
  {
    code: 'S1-TI',
    name: 'S1 Teknik Informatika',
    rumpunName: 'Rumpun Teknik Informatika',
    degree: 'S1',
  },
  {
    code: 'S1-SI',
    name: 'S1 Sistem Informasi',
    rumpunName: 'Rumpun Teknik Informatika',
    degree: 'S1',
  },

  // Rumpun Teknik Sipil
  {
    code: 'S1-PTB',
    name: 'S1 Pendidikan Teknik Bangunan',
    rumpunName: 'Rumpun Teknik Sipil',
    degree: 'S1',
  },
  {
    code: 'S1-TS',
    name: 'S1 Teknik Sipil',
    rumpunName: 'Rumpun Teknik Sipil',
    degree: 'S1',
  },
  {
    code: 'S1-PWK',
    name: 'S1 Perencanaan Wilayah dan Kota',
    rumpunName: 'Rumpun Teknik Sipil',
    degree: 'S1',
  },

  // Rumpun PKK
  {
    code: 'S1-PTBG',
    name: 'S1 Pendidikan Tata Boga',
    rumpunName: 'Rumpun PKK',
    degree: 'S1',
  },
  {
    code: 'S1-PTBS',
    name: 'S1 Pendidikan Tata Busana',
    rumpunName: 'Rumpun PKK',
    degree: 'S1',
  },
  {
    code: 'S1-PTR',
    name: 'S1 Pendidikan Tata Rias',
    rumpunName: 'Rumpun PKK',
    degree: 'S1',
  },
  {
    code: 'S1-PAR',
    name: 'S1 Pariwisata',
    rumpunName: 'Rumpun PKK',
    degree: 'S1',
  },
];

// Nama 50 Gugus Adrata FT UNESA 2026 (indeks 0 → Gugus nomor 1, dst.).
const GUGUS_NAMES = [
  'Majapahit',
  'Sriwijaya',
  'Singasari',
  'Kediri',
  'Medang',
  'Mataram',
  'Kutai',
  'Kalingga',
  'Tarumanegara',
  'Pajajaran',
  'Kahuripan',
  'Janggala',
  'Galuh',
  'Panjalu',
  'Kanjuruhan',
  'Blambangan',
  'Dharmasraya',
  'Pagaruyung',
  'Demak',
  'Pajang',
  'Banten',
  'Cirebon',
  'Ternate',
  'Tidore',
  'Bacan',
  'Jailolo',
  'Gowa',
  'Bone',
  'Luwu',
  'Wajo',
  'Soppeng',
  'Buton',
  'Banjar',
  'Siak',
  'Lamuri',
  'Indrapura',
  'Kandis',
  'Konawe',
  'Banggai',
  'Selaparang',
  'Aceh Darussalam',
  'Lingga',
  'Kutai Kartanegara',
  'Melayu',
  'Salakanagara',
  'Sunda Galuh',
  'Bulungan',
  'Aru',
  'Sambas',
  'Kutaringin',
];

async function seed() {
  console.log(
    '🚀 Connecting to MongoDB for Gugus & Master Data Seeding:',
    MONGODB_URI,
  );
  const conn = await connect(MONGODB_URI);
  const db = conn.connection.db;

  if (!db) {
    throw new Error('Database connection failed.');
  }

  // 1. Seed Rumpun
  console.log('📦 Seeding Rumpun Master Data...');
  const rumpunMap = new Map<string, string>();
  for (const r of RUMPUN_DATA) {
    const res = await db
      .collection('pkkmb_rumpun')
      .findOneAndUpdate(
        { name: r.name },
        { $set: r },
        { upsert: true, returnDocument: 'after' },
      );
    if (res?._id) {
      rumpunMap.set(r.name, res._id.toString());
    }
  }
  console.log(`✅ Seeded ${rumpunMap.size} Rumpun Academic Categories.`);

  // 2. Seed Study Programs
  console.log('📚 Seeding Study Programs Master Data...');
  const studyProgramMap = new Map<string, string>();
  for (const sp of STUDY_PROGRAMS_DATA) {
    const rumpunId = rumpunMap.get(sp.rumpunName);
    if (!rumpunId) continue;

    const res = await db.collection('pkkmb_study_programs').findOneAndUpdate(
      { code: sp.code },
      {
        $set: {
          code: sp.code,
          name: sp.name,
          rumpun: rumpunId,
          faculty: 'Fakultas Teknik',
          degree: sp.degree,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );
    if (res?._id) {
      studyProgramMap.set(sp.code, res._id.toString());
      studyProgramMap.set(sp.name, res._id.toString());
    }
  }
  console.log(`✅ Seeded ${STUDY_PROGRAMS_DATA.length} Study Programs.`);

  // 3. Seed 50 Gugus (Gugus 01 - Gugus 50) — nama sejarah Adrata FT 2026.
  console.log('🛡️ Seeding 50 Gugus PKKMB FT UNESA 2026...');
  let gugusCount = 0;
  for (let i = 1; i <= 50; i++) {
    const nomor = i;
    const name = GUGUS_NAMES[i - 1];

    await db.collection('pkkmb_gugus').findOneAndUpdate(
      { nomor },
      {
        $set: {
          nomor,
          name,
          kapasitas: 60,
          status: 'ACTIVE',
          totalPoints: 0,
        },
      },
      { upsert: true },
    );
    gugusCount++;
  }
  console.log(`✅ Seeded ${gugusCount} Gugus (Gugus 01 to Gugus 50).`);

  await disconnect();
  console.log('🎉 Gugus Master Data Seeding Completed!');
}

seed().catch((err) => {
  console.error('❌ Gugus Seeding Error:', err);
  process.exit(1);
});
