import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bemft_db';

// Gugus dikenali lewat nama (Majapahit, Sriwijaya, dst).
// Email dikoreksi menjadi @mhs.unesa.ac.id bila typo.
const PENDAMPING_50 = [
  { no: 1, gugus: 'Majapahit', name: 'Khaylila Nismara Sahasika', wa: 'https://wa.me/6289699003722', email: '24050404008@mhs.unesa.ac.id' },
  { no: 2, gugus: 'Sriwijaya', name: 'Mohammad Atho’ul Hikam', wa: 'https://wa.me/6285731461337', email: '25050724141@mhs.unesa.ac.id' },
  { no: 3, gugus: 'Singasari', name: 'Febriana Regina Artanti', wa: 'https://wa.me/6288991875768', email: '25051204148@mhs.unesa.ac.id' },
  { no: 4, gugus: 'Kediri', name: 'Brilliant Adam Awwaluddin Shonif', wa: 'https://wa.me/6285117119861', email: '25051214133@mhs.unesa.ac.id' },
  { no: 5, gugus: 'Medang', name: 'Wiwin Rahma Sari', wa: 'https://wa.me/6281944050345', email: '25050534063@mhs.unesa.ac.id' },
  { no: 6, gugus: 'Mataram', name: 'Vannesa Sharani Al Adisty', wa: 'https://wa.me/62881036173528', email: '25050534069@mhs.unesa.ac.id' },
  { no: 7, gugus: 'Kutai', name: 'Nadine Puteri Safira', wa: 'https://wa.me/6281234101062', email: '25050974050@mhs.unesa.ac.id' },
  { no: 8, gugus: 'Kalingga', name: 'Faiza Yasmine B', wa: 'https://wa.me/6281230925022', email: '25050974141@mhs.unesa.ac.id' },
  { no: 9, gugus: 'Tarumanegara', name: 'Achmad Krisna Nurvian Ananda', wa: 'https://wa.me/6283189865012', email: '25051204134@mhs.unesa.ac.id' },
  { no: 10, gugus: 'Pajajaran', name: 'Firda Ananda', wa: 'https://wa.me/62895604010003', email: '25051204129@mhs.unesa.ac.id' },
  { no: 11, gugus: 'Kahuripan', name: 'Ummu Nabiilah Nur Wasiilah', wa: 'https://wa.me/6282332651661', email: '25050404056@mhs.unesa.ac.id' },
  { no: 12, gugus: 'Janggala', name: 'Dian Anggraini Adha', wa: 'https://wa.me/6282255909641', email: '24050634070@mhs.unesa.ac.id' },
  { no: 13, gugus: 'Galuh', name: 'Dhea Sarrah', wa: 'https://wa.me/6282133049588', email: '25051204432@mhs.unesa.ac.id' },
  { no: 14, gugus: 'Panjalu', name: 'Shintya Clara Damanik', wa: 'https://wa.me/6281260607283', email: '24050404064@mhs.unesa.ac.id' },
  { no: 15, gugus: 'Kanjuruhan', name: 'Sandhika Lyandra P', wa: 'https://wa.me/6281359358477', email: 'sandhika.23074@mhs.unesa.ac.id' },
  { no: 16, gugus: 'Blambangan', name: 'Nayottama Kumara Rahayu', wa: 'https://wa.me/6281232610277', email: '25050974001@mhs.unesa.ac.id' },
  { no: 17, gugus: 'Dharmasraya', name: 'Kartika Dela A.', wa: 'https://wa.me/6285964410657', email: '24050514050@mhs.unesa.ac.id' },
  { no: 18, gugus: 'Pagaruyung', name: 'Cantika Maharani A.A.K', wa: 'https://wa.me/628563315483', email: '25050974034@mhs.unesa.ac.id' },
  { no: 19, gugus: 'Demak', name: 'Pramesya Zhafira Rajaby', wa: 'https://wa.me/6282229300612', email: '25050974019@mhs.unesa.ac.id' },
  { no: 20, gugus: 'Pajang', name: 'Anggi Panggabean', wa: 'https://wa.me/6281265298615', email: '25050724042@mhs.unesa.ac.id' },
  { no: 21, gugus: 'Banten', name: 'Fachri Alfaturrahman Nuryadi', wa: 'https://wa.me/6281386350479', email: '25050724256@mhs.unesa.ac.id' },
  { no: 22, gugus: 'Cirebon', name: 'Nadia Rizkiarsa R.', wa: 'https://wa.me/62895396650804', email: '25051214058@mhs.unesa.ac.id' },
  { no: 23, gugus: 'Ternate', name: 'Ardenia Revita Kanesti', wa: 'https://wa.me/6282298303795', email: '24051214060@mhs.unesa.ac.id' },
  { no: 24, gugus: 'Tidore', name: 'Cheivo De Najwa Hariyanto', wa: 'https://wa.me/6289527998055', email: '24051214053@mhs.unesa.ac.id' },
  { no: 25, gugus: 'Bacan', name: 'Farrell Raditya Raharjo Putra', wa: 'https://wa.me/6281339618822', email: '25050724146@mhs.unesa.ac.id' },
  { no: 26, gugus: 'Jailolo', name: 'Sona Maulana Ilham', wa: 'https://wa.me/62859180528753', email: '25051874074@mhs.unesa.ac.id' },
  { no: 27, gugus: 'Gowa', name: 'Muhammad Hanif Fayshol', wa: 'https://wa.me/6287835225886', email: 'muhammad.hanif23298@mhs.unesa.ac.id' },
  { no: 28, gugus: 'Bone', name: 'Ayu Artha Wulan Ndari', wa: 'https://wa.me/6281917175205', email: '24051214022@mhs.unesa.ac.id' },
  { no: 29, gugus: 'Luwu', name: 'M. Abiyyu Abrar H', wa: 'https://wa.me/6281231488062', email: '25051204202@mhs.unesa.ac.id' },
  { no: 30, gugus: 'Wajo', name: 'M. Bayu Krisna M', wa: 'https://wa.me/6281232176940', email: '25051214218@mhs.unesa.ac.id' },
  { no: 31, gugus: 'Soppeng', name: 'M. Yardan Nobel Wiryawan', wa: 'https://wa.me/6285947600156', email: '25050964165@mhs.unesa.ac.id' },
  { no: 32, gugus: 'Buton', name: 'Ayu Perwita Sari', wa: 'https://wa.me/6282337432922', email: '25051874038@mhs.unesa.ac.id' },
  { no: 33, gugus: 'Banjar', name: 'Salma Anindy Utami Raissa P.', wa: 'https://wa.me/6288294422705', email: '25050874175@mhs.unesa.ac.id' },
  { no: 34, gugus: 'Siak', name: 'Muchamad Ryan Hidayatulloh', wa: 'https://wa.me/6289515925635', email: '25050974048@mhs.unesa.ac.id' },
  { no: 35, gugus: 'Lamuri', name: 'Ayesha Humayra Nadra Rafianti', wa: 'https://wa.me/6288994278669', email: '25051204430@mhs.unesa.ac.id' },
  { no: 36, gugus: 'Indrapura', name: 'Aulia Syifa Sabiqul Khair', wa: 'https://wa.me/6287815080465', email: 'auliasyifa.23214@mhs.unesa.ac.id' },
  { no: 37, gugus: 'Kandis', name: 'Herrista Meichika Wurianita', wa: 'https://wa.me/6282233254922', email: 'herrista.23012@mhs.unesa.ac.id' },
  { no: 38, gugus: 'Konawe', name: 'Hawa Zalza Zahra', wa: 'https://wa.me/6281558149099', email: '25051214221@mhs.unesa.ac.id' },
  { no: 39, gugus: 'Banggai', name: 'Mithara Selma Humairoh', wa: 'https://wa.me/6283130039898', email: '24050404024@mhs.unesa.ac.id' },
  { no: 40, gugus: 'Selaparang', name: 'Salsabilla Oktavia Ramadhani', wa: 'https://wa.me/6287776675759', email: '25051204393@mhs.unesa.ac.id' },
  { no: 41, gugus: 'Aceh Darussalam', name: 'Royhan Balqis', wa: 'https://wa.me/6285755636548', email: '24050874012@mhs.unesa.ac.id' },
  { no: 42, gugus: 'Lingga', name: 'Siska Nur Fauziah', wa: 'https://wa.me/6283838507176', email: '25051204440@mhs.unesa.ac.id' },
  { no: 43, gugus: 'Kutai Kartanegara', name: 'Jois Miranda Agunning Putri', wa: 'https://wa.me/6282331352736', email: '25051204427@mhs.unesa.ac.id' },
  { no: 44, gugus: 'Melayu', name: 'Lita Sofiana Azzahro', wa: 'https://wa.me/6285800752841', email: '25050874097@mhs.unesa.ac.id' },
  { no: 45, gugus: 'Salakanagara', name: 'Chealsea Aurellyanas Thasya', wa: 'https://wa.me/6285769522890', email: '25050634064@mhs.unesa.ac.id' },
  { no: 46, gugus: 'Sunda Galuh', name: 'Mandriva Radithya Cahyadi', wa: 'https://wa.me/6285607589130', email: '25051204406@mhs.unesa.ac.id' },
  { no: 47, gugus: 'Bulungan', name: 'Muhammad Uzzam Jalud Khan', wa: 'https://wa.me/6285803320221', email: '25050724001@mhs.unesa.ac.id' },
  { no: 48, gugus: 'Aru', name: 'Muchamad Fahrizal', wa: 'https://wa.me/6288803149420', email: '25050874084@mhs.unesa.ac.id' },
  { no: 49, gugus: 'Sambas', name: 'Sahrul Romadoni', wa: 'https://wa.me/6287790296743', email: '24050874156@mhs.unesa.ac.id' },
  { no: 50, gugus: 'Kutaringin', name: 'Fadil Hasan Al Rafli E.S', wa: 'https://wa.me/6285954399096', email: '24050874098@mhs.unesa.ac.id' },
];

async function seed() {
  const conn = await connect(MONGODB_URI);
  console.log('🔌 Koneksi DB sukses.');

  const db = conn.connection.db!;

  // Role panitia.
  const role = await db.collection('roles').findOne({ slug: 'panitia' });
  if (!role) {
    throw new Error('Role "panitia" tidak ditemukan. Jalankan seed-rbac dulu.');
  }

  let created = 0;
  let updated = 0;
  let assigned = 0;
  let missingGugus = 0;

  for (const p of PENDAMPING_50) {
    const email = p.email.toLowerCase();
    const gugus = await db
      .collection('pkkmb_gugus')
      .findOne({ nomor: p.no, deletedAt: null });
    if (!gugus) {
      console.warn(`⚠️  Gugus nomor ${p.no} (${p.gugus}) tidak ditemukan.`);
      missingGugus++;
      continue;
    }

    const existing = await db.collection('users').findOne({ email });
    let userId: string;
    if (existing) {
      // Kalau user sudah ada (mis. pernah login sebagai maba), promosi ke pendamping.
      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            name: p.name,
            role: role._id,
            division: 'Sie Pendamping',
            position: 'Pendamping Gugus',
            isActive: true,
            pkkmbGroup: gugus._id,
            cabinetPeriod: '2026',
            pendampingName: p.name,
            pendampingWhatsApp: p.wa,
            pendampingEmail: p.email,
          },
        },
      );
      userId = existing._id.toString();
      updated++;
    } else {
      const res = await db.collection('users').insertOne({
        name: p.name,
        email,
        role: role._id,
        division: 'Sie Pendamping',
        position: 'Pendamping Gugus',
        isActive: true,
        avatar: '',
        cabinetPeriod: '2026',
        pkkmbGroup: gugus._id,
        isOnboarded: true,
        assignmentStatus: 'ASSIGNED',
        pendampingName: p.name,
        pendampingWhatsApp: p.wa,
        pendampingEmail: p.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userId = res.insertedId.toString();
      created++;
    }

    // Set pendamping di gugus.
    await db.collection('pkkmb_gugus').updateOne(
      { _id: gugus._id },
      {
        $set: {
          pendampingId: userId,
          pendampingName: p.name,
          pendampingWhatsApp: p.wa,
          pendampingEmail: p.email,
        },
      },
    );
    assigned++;
  }

  console.log(
    `✅ Selesai. Dibuat: ${created}, Diupdate: ${updated}, Gugus di-assign: ${assigned}, Gugus hilang: ${missingGugus}`,
  );

  await disconnect();
  console.log('🎉 Pendamping 50 seeding selesai!');
}

seed().catch((err) => {
  console.error('❌ Pendamping 50 Seeding Error:', err);
  process.exit(1);
});
