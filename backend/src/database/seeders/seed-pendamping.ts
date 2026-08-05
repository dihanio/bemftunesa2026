import { connect, disconnect } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

const PENDAMPING_DATA = [
  {
    nomor: 1,
    name: 'Majapahit',
    pendampingName: 'Khaylila Nismara Sahasika',
    pendampingWhatsApp: 'https://wa.me/6289699003722',
    pendampingEmail: '24050404008@mhs.unesa.ac.id',
  },
  {
    nomor: 2,
    name: 'Sriwijaya',
    pendampingName: 'Mohammad Atho’ul Hikam',
    pendampingWhatsApp: 'https://wa.me/6285731461337',
    pendampingEmail: '25050724141@mhs.unesa.ac.id',
  },
  {
    nomor: 3,
    name: 'Singasari',
    pendampingName: 'Febriana Regina Artanti',
    pendampingWhatsApp: 'https://wa.me/6288991875768',
    pendampingEmail: '25051204148@mhs.unesa.ac.id',
  },
  {
    nomor: 4,
    name: 'Kediri',
    pendampingName: 'Brilliant Adam Awwaluddin Shonif',
    pendampingWhatsApp: 'https://wa.me/6285117119861',
    pendampingEmail: '25051214133@mhs.unesa.ac.id',
  },
  {
    nomor: 5,
    name: 'Medang',
    pendampingName: 'Wiwin Rahma Sari',
    pendampingWhatsApp: 'https://wa.me/6281944050345',
    pendampingEmail: '25050534063@mhs.unesa.ac.id',
  },
  {
    nomor: 6,
    name: 'Mataram',
    pendampingName: 'Vannesa Sharani Al Adisty',
    pendampingWhatsApp: 'https://wa.me/62881036173528',
    pendampingEmail: '25050534069@mhs.unesa.ac.id',
  },
  {
    nomor: 7,
    name: 'Kutai',
    pendampingName: 'Nadine Puteri Safira',
    pendampingWhatsApp: 'https://wa.me/6281234101062',
    pendampingEmail: '25050974050@mhs.unesa.ac.id',
  },
  {
    nomor: 8,
    name: 'Kalingga',
    pendampingName: 'Faiza Yasmine B',
    pendampingWhatsApp: 'https://wa.me/6281230925022',
    pendampingEmail: '25050974141@mhs.unesa.ac.id',
  },
  {
    nomor: 9,
    name: 'Tarumanegara',
    pendampingName: 'Achmad Krisna Nurvian Ananda',
    pendampingWhatsApp: 'https://wa.me/6283189865012',
    pendampingEmail: '25051204134@mhs.unesa.ac.id',
  },
  {
    nomor: 10,
    name: 'Pajajaran',
    pendampingName: 'Firda Ananda',
    pendampingWhatsApp: 'https://wa.me/62895604010003',
    pendampingEmail: '25051204129@mhs.unesa.ac.id',
  },
  {
    nomor: 11,
    name: 'Kahuripan',
    pendampingName: 'Ummu Nabiilah Nur Wasiilah',
    pendampingWhatsApp: 'https://wa.me/6282332651661',
    pendampingEmail: '25050404056@mhs.unesa.ac.id',
  },
  {
    nomor: 12,
    name: 'Janggala',
    pendampingName: 'Dian Anggraini Adha',
    pendampingWhatsApp: 'https://wa.me/6282255909641',
    pendampingEmail: '24050634070@mhs.unesa.ac.id',
  },
  {
    nomor: 13,
    name: 'Galuh',
    pendampingName: 'Dhea Sarrah',
    pendampingWhatsApp: 'https://wa.me/6282133049588',
    pendampingEmail: '25051204432@mhs.unesa.ac.id',
  },
  {
    nomor: 14,
    name: 'Panjalu',
    pendampingName: 'Shintya Clara Damanik',
    pendampingWhatsApp: 'https://wa.me/6281260607283',
    pendampingEmail: '24050404064@mhs.unesa.ac.id',
  },
  {
    nomor: 15,
    name: 'Kanjuruhan',
    pendampingName: 'Sandhika Lyandra P',
    pendampingWhatsApp: 'https://wa.me/6281359358477',
    pendampingEmail: 'sandhika.23074@mhs.unesa.ac.id',
  },
  {
    nomor: 16,
    name: 'Blambangan',
    pendampingName: 'Nayottama Kumara Rahayu',
    pendampingWhatsApp: 'https://wa.me/6281232610277',
    pendampingEmail: '25050974001@mhs.unesa.ac.id',
  },
  {
    nomor: 17,
    name: 'Dharmasraya',
    pendampingName: 'Kartika Dela A.',
    pendampingWhatsApp: 'https://wa.me/6285964410657',
    pendampingEmail: '24050514050@mhs.unesa.ac.id',
  },
  {
    nomor: 18,
    name: 'Pagaruyung',
    pendampingName: 'Cantika Maharani A.A.K',
    pendampingWhatsApp: 'https://wa.me/628563315483',
    pendampingEmail: '25050974034@mhs.unesa.ac.id',
  },
  {
    nomor: 19,
    name: 'Demak',
    pendampingName: 'Pramesya Zhafira Rajaby',
    pendampingWhatsApp: 'https://wa.me/6282229300612',
    pendampingEmail: '25050974019@mhs.unesa.ac.id',
  },
  {
    nomor: 20,
    name: 'Pajang',
    pendampingName: 'Anggi Panggabean',
    pendampingWhatsApp: 'https://wa.me/6281265298615',
    pendampingEmail: '25050724042@mhs.unesa.ac.id',
  },
  {
    nomor: 21,
    name: 'Banten',
    pendampingName: 'Fachri Alfaturrahman Nuryadi',
    pendampingWhatsApp: 'https://wa.me/6281386350479',
    pendampingEmail: '25050724256@mhs.unesa.ac.id',
  },
  {
    nomor: 22,
    name: 'Cirebon',
    pendampingName: 'Nadia Rizkiarsa R.',
    pendampingWhatsApp: 'https://wa.me/62895396650804',
    pendampingEmail: '24051214058@mhs.unesa.ac.id',
  },
  {
    nomor: 23,
    name: 'Ternate',
    pendampingName: 'Ardenia Revita Kanesti',
    pendampingWhatsApp: 'https://wa.me/6282298303795',
    pendampingEmail: '24051214060@mhs.unesa.ac.id',
  },
  {
    nomor: 24,
    name: 'Tidore',
    pendampingName: 'Cheivo De Najwa Hariyanto',
    pendampingWhatsApp: 'https://wa.me/6289527998055',
    pendampingEmail: '24051214053@mhs.unesa.ac.id',
  },
  {
    nomor: 25,
    name: 'Bacan',
    pendampingName: 'Farrell Raditya Raharjo Putra',
    pendampingWhatsApp: 'https://wa.me/6281339618822',
    pendampingEmail: '25050724146@mhs.unesa.ac.id',
  },
  {
    nomor: 26,
    name: 'Jailolo',
    pendampingName: 'Sona Maulana Ilham',
    pendampingWhatsApp: 'https://wa.me/62859180528753',
    pendampingEmail: '25051874074@mhs.unesa.ac.id',
  },
  {
    nomor: 27,
    name: 'Gowa',
    pendampingName: 'Muhammad Hanif Fayshol',
    pendampingWhatsApp: 'https://wa.me/6287835225886',
    pendampingEmail: 'muhammad.hanif23298@mhs.unesa.ac.id',
  },
  {
    nomor: 28,
    name: 'Bone',
    pendampingName: 'Ayu Artha Wulan Ndari',
    pendampingWhatsApp: 'https://wa.me/6281917175205',
    pendampingEmail: '24051214022@mhs.unesa.ac.id',
  },
  {
    nomor: 29,
    name: 'Luwu',
    pendampingName: 'M. Abiyyu Abrar H',
    pendampingWhatsApp: 'https://wa.me/6281231488062',
    pendampingEmail: '25051204202@mhs.unesa.ac.id',
  },
  {
    nomor: 30,
    name: 'Wajo',
    pendampingName: 'M. Bayu Krisna M',
    pendampingWhatsApp: 'https://wa.me/6281232176940',
    pendampingEmail: '25051214218@mhs.unesa.ac.id',
  },
  {
    nomor: 31,
    name: 'Soppeng',
    pendampingName: 'M. Yardan Nobel Wiryawan',
    pendampingWhatsApp: 'https://wa.me/6285947600156',
    pendampingEmail: '25050964165@unesa.mhs',
  },
  {
    nomor: 32,
    name: 'Buton',
    pendampingName: 'Ayu Perwita Sari',
    pendampingWhatsApp: 'https://wa.me/6282337432922',
    pendampingEmail: '25051874038@mhs.unesa.ac.id',
  },
  {
    nomor: 33,
    name: 'Banjar',
    pendampingName: 'Salma Anindy Utami Raissa P.',
    pendampingWhatsApp: 'https://wa.me/6288294422705',
    pendampingEmail: '25050874175@mhs.uneaa.ac.id',
  },
  {
    nomor: 34,
    name: 'Siak',
    pendampingName: 'Muchamad Ryan Hidayatulloh',
    pendampingWhatsApp: 'https://wa.me/6289515925635',
    pendampingEmail: '25050974048@mhs.unesa.ac.id',
  },
  {
    nomor: 35,
    name: 'Lamuri',
    pendampingName: 'Ayesha Humayra Nadra Rafianti',
    pendampingWhatsApp: 'https://wa.me/6288994278669',
    pendampingEmail: '25051204430@mhs.unesa.ac.id',
  },
  {
    nomor: 36,
    name: 'Indrapura',
    pendampingName: 'Aulia Syifa Sabiqul Khair',
    pendampingWhatsApp: 'https://wa.me/6287815080465',
    pendampingEmail: 'auliasyifa.23214@mhs.unesa.ac.id',
  },
  {
    nomor: 37,
    name: 'Kandis',
    pendampingName: 'Herrista Meichika Wurianita',
    pendampingWhatsApp: 'https://wa.me/6282233254922',
    pendampingEmail: 'herrista.23012@mhs.unesa.ac.id',
  },
  {
    nomor: 38,
    name: 'Konawe',
    pendampingName: 'Hawa Zalza Zahra',
    pendampingWhatsApp: 'https://wa.me/6281558149099',
    pendampingEmail: '25051214221@mhs.unesa.ac.id',
  },
  {
    nomor: 39,
    name: 'Banggai',
    pendampingName: 'Mithara Selma Humairoh',
    pendampingWhatsApp: 'https://wa.me/6283130039898',
    pendampingEmail: '24050404024@mhs.unesa.ac.id',
  },
  {
    nomor: 40,
    name: 'Selaparang',
    pendampingName: 'Salsabilla Oktavia Ramadhani',
    pendampingWhatsApp: 'https://wa.me/6287776675759',
    pendampingEmail: '25051204393@mhs.unesa.ac.id',
  },
  {
    nomor: 41,
    name: 'Aceh Darussalam',
    pendampingName: 'Royhan Balqis',
    pendampingWhatsApp: 'https://wa.me/6285755636548',
    pendampingEmail: '24050874012@mhs.unesa.ac.id',
  },
  {
    nomor: 42,
    name: 'Lingga',
    pendampingName: 'Siska Nur Fauziah',
    pendampingWhatsApp: 'https://wa.me/6283838507176',
    pendampingEmail: '25051204440@mhs.unesa.ac.id',
  },
  {
    nomor: 43,
    name: 'Kutai Kartanegara',
    pendampingName: 'Jois Miranda Agunning Putri',
    pendampingWhatsApp: 'https://wa.me/6282331352736',
    pendampingEmail: '25051204427@mhs.unesa.ac.id',
  },
  {
    nomor: 44,
    name: 'Melayu',
    pendampingName: 'Lita Sofiana Azzahro',
    pendampingWhatsApp: 'https://wa.me/6285800752841',
    pendampingEmail: '25050874097@mhs.unesa.ac.id',
  },
  {
    nomor: 45,
    name: 'Salakanagara',
    pendampingName: 'Chealsea Aurellyanas Thasya',
    pendampingWhatsApp: 'https://wa.me/6285769522890',
    pendampingEmail: '25050634064@mhs.unesa.ac.id',
  },
  {
    nomor: 46,
    name: 'Sunda Galuh',
    pendampingName: 'Mandriva Radithya Cahyadi',
    pendampingWhatsApp: 'https://wa.me/6285607589130',
    pendampingEmail: '25051204406@mhs.unesa.ac.id',
  },
  {
    nomor: 47,
    name: 'Bulungan',
    pendampingName: 'Muhammad Uzzam Jalud Khan',
    pendampingWhatsApp: 'https://wa.me/6285803320221',
    pendampingEmail: '25050724001@mhs.unesa.ac.id',
  },
  {
    nomor: 48,
    name: 'Aru',
    pendampingName: 'Muchamad Fahrizal',
    pendampingWhatsApp: 'https://wa.me/6288803149420',
    pendampingEmail: '25050874084@mhs.unesa.ac.id',
  },
  {
    nomor: 49,
    name: 'Sambas',
    pendampingName: 'Sahrul Romadoni',
    pendampingWhatsApp: 'https://wa.me/6287790296743',
    pendampingEmail: '24050874156@mhs.unesa.ac.id',
  },
  {
    nomor: 50,
    name: 'Kutaringin',
    pendampingName: 'Fadil Hasan Al Rafli E.S',
    pendampingWhatsApp: 'https://wa.me/6285954399096',
    pendampingEmail: '24050874098@mhs.unesa.ac.id',
  },
];

async function seed() {
  console.log(
    '🚀 Connecting to MongoDB for Pendamping Gugus Seeding:',
    MONGODB_URI,
  );
  const conn = await connect(MONGODB_URI);
  const db = conn.connection.db;

  if (!db) {
    throw new Error('Database connection failed.');
  }

  const panitiaRoleRaw = await db
    .collection('roles')
    .findOne({ slug: 'panitia' });
  if (!panitiaRoleRaw) {
    throw new Error(
      'Role panitia tidak ditemukan. Jalankan seed-rbac.ts terlebih dahulu.',
    );
  }

  const panitiaRoleId = String(panitiaRoleRaw._id);

  const passwordHash = await bcrypt.hash('Pendamping2026!', 10);
  let updated = 0;

  for (const item of PENDAMPING_DATA) {
    const user = await db
      .collection('users')
      .findOne({ email: item.pendampingEmail });
    let userId: string;

    if (!user) {
      const created = await db.collection('users').insertOne({
        name: item.pendampingName,
        email: item.pendampingEmail.toLowerCase(),
        nim: item.pendampingEmail.split('@')[0],
        password: passwordHash,
        role: panitiaRoleId,
        division: 'Sie Pendamping',
        position: `Pendamping Gugus ${item.name}`,
        studyProgram: '',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userId = String(created.insertedId);
    } else {
      userId = String(user._id);
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            name: item.pendampingName,
            role: panitiaRoleId,
            division: 'Sie Pendamping',
            position: `Pendamping Gugus ${item.name}`,
            updatedAt: new Date(),
          },
        },
      );
    }

    await db.collection('pkkmb_gugus').findOneAndUpdate(
      { nomor: item.nomor },
      {
        $set: {
          nomor: item.nomor,
          name: item.name,
          kapasitas: 60,
          status: 'ACTIVE',
          totalPoints: 0,
          pendampingName: item.pendampingName,
          pendampingWhatsApp: item.pendampingWhatsApp,
          pendampingEmail: item.pendampingEmail,
          pendampingId: userId,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    updated++;
  }

  console.log(`✅ Updated ${updated} Gugus with pendamping accounts/data.`);

  await disconnect();
  console.log('🎉 Pendamping Gugus Seeding Completed!');
}

seed().catch((err) => {
  console.error('❌ Pendamping Gugus Seeding Error:', err);
  process.exit(1);
});
