import 'reflect-metadata';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemft-cms';

const suratTemplates = [
  // ═══════════════════════════════════════════
  // SURAT KELUAR (EKSTERNAL)
  // ═══════════════════════════════════════════
  {
    id: 'surat-dispensasi',
    name: 'Surat Dispensasi',
    description: 'Template surat dispensasi resmi BEM FT UNESA',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1dXGOEqxnru_TaqUBvzy9IQgXFMj6RLPaTehqW6OjzoU/edit',
  },
  {
    id: 'surat-peminjaman-fasilitas-eksternal',
    name: 'Surat Peminjaman Fasilitas Eksternal FT',
    description: 'Template surat peminjaman fasilitas di luar lingkungan FT',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1qB6aIDfm7ztNQvRQ0z-R61mQGvYVxMjsI39n0hnlVxQ/edit',
  },
  {
    id: 'surat-peminjaman-fasilitas-internal',
    name: 'Surat Peminjaman Fasilitas Internal FT',
    description: 'Template surat peminjaman fasilitas di dalam lingkungan FT',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1X3vKbKydtIAafdUhp5VgIYVWqbloRUBiVyiVvYFX_ZY/edit',
  },
  {
    id: 'surat-penawaran-sponsor',
    name: 'Surat Penawaran Sponsor',
    description: 'Template surat penawaran kerja sama sponsorship',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1ZvhdgEy_OdiSz3rEevSLlChcWc8p4XyOQGT7-TIVs7I/edit',
  },
  {
    id: 'surat-perjanjian-kerja-sama',
    name: 'Surat Perjanjian Kerja Sama',
    description: 'Template surat perjanjian kerja sama (MoU/MoA)',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1Gm8Q29t9hujKCg6d6JhhZo6Jhueb1zzY2dCvuig8y0U/edit',
  },
  {
    id: 'surat-permohonan-delegasi',
    name: 'Surat Permohonan Delegasi',
    description: 'Template surat permohonan delegasi ke kegiatan luar',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1Tp4uZg-JNG5KPtGKoNWHcys0iCK6gekQXh1wL2pgJTc/edit',
  },
  {
    id: 'surat-permohonan-peminjaman-barang',
    name: 'Surat Permohonan Peminjaman Barang',
    description: 'Template surat permohonan peminjaman barang/inventaris',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1iHJlMoeoEefxzr5nc-wbJ2wYwSYMv4D9Jir0EoB_lGA/edit',
  },
  {
    id: 'surat-permohonan-perizinan-kegiatan',
    name: 'Surat Permohonan Perizinan Kegiatan Institusi',
    description: 'Template surat permohonan izin penyelenggaraan kegiatan',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1SCpDrW7VxF1StFDvYFYzU1j-af0tftHuWhVZM44N7MM/edit',
  },
  {
    id: 'surat-permohonan-surat-tugas',
    name: 'Surat Permohonan Surat Tugas dari FT',
    description: 'Template permohonan ST dari Fakultas Teknik',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1VWzETwxbh73rX22UfaYwn_ooWzPNXXm62COwbUzm5HI/edit',
  },
  {
    id: 'surat-undangan-sambutan-kabem',
    name: 'Surat Undangan Sambutan Kabem',
    description: 'Template surat undangan dengan sambutan Ketua BEM',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1Zz1Johj2CzRDFZWr-qAWq6ZuH9ckLVixvpXYlii8mRc/edit',
  },
  {
    id: 'surat-undangan-sambutan-pembina',
    name: 'Surat Undangan Sambutan Pembina',
    description: 'Template surat undangan dengan sambutan Pembina BEM',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1E7-3ikG_Rx78FBsII4PeUm1-kOloZjjO7to9vQyF6XE/edit',
  },
  {
    id: 'surat-undangan-sambutan-wd1',
    name: 'Surat Undangan Sambutan WD 1',
    description: 'Template surat undangan dengan sambutan Wakil Dekan I',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1X1M-7p490KkT6ZxzW8EggnHQU-9xnCt8bIKZTgxqKSQ/edit',
  },
  {
    id: 'surat-permohonan-izin-keramaian',
    name: 'Surat Permohonan Izin Keramaian FT',
    description: 'Template surat izin keramaian di lingkungan FT',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/12Hl3eoSLerYGFxe9oFlagPFIOuWL-5PR65_DnBGzERE/edit',
  },
  {
    id: 'surat-permohonan-audiensi',
    name: 'Surat Permohonan Audiensi',
    description: 'Template surat permohonan audiensi dengan pejabat/instansi',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/15kMWSmf33CRL61zXo3UuqY-x8fo-SwCbmTReFvqjUwo/edit',
  },
  {
    id: 'surat-permohonan-sponsor-barang',
    name: 'Surat Permohonan Sponsor Barang',
    description: 'Template surat permohonan sponsorship berupa barang',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1ExIppxyOxAkZnTX-GycAytKx2f89RjEzABO3p9ID0Lw/edit',
  },
  {
    id: 'surat-permohonan-data-informasi',
    name: 'Surat Permohonan Data / Informasi',
    description: 'Template surat permohonan data atau informasi resmi',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1UgvUFFjDbLosV-1NEBt2Mh5ROJ90T8iXt7eRiD0KbjQ/edit',
  },
  {
    id: 'surat-permohonan-narasumber',
    name: 'Surat Permohonan Narasumber',
    description: 'Template surat permohonan narasumber untuk kegiatan',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1vAE5sguUiRMT_PqspcI8umCuBJrFhnyWwGF-M1QtLi8/edit',
  },
  {
    id: 'surat-permohonan-media-partner',
    name: 'Surat Permohonan Media Partner',
    description: 'Template surat permohonan kerja sama media partner',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/19ZQnJzvF7ke66GPgWc2wOUqpbQ8fjD5JNhZuyRxE7mQ/edit',
  },

  // ═══════════════════════════════════════════
  // SURAT KEPUTUSAN (SK)
  // ═══════════════════════════════════════════
  {
    id: 'sk-kepanitiaan',
    name: 'Surat Keputusan Kepanitiaan',
    description: 'Template SK pembentukan kepanitiaan kegiatan',
    category: 'sk',
    googleDriveUrl: 'https://drive.google.com/open?id=1p_-Of4RPISPEQnPxCm3y53yj9V0jch7YD1ehUv4sp38',
  },
  {
    id: 'sk-pembentukan-tim',
    name: 'Surat Keputusan Pembentukan Tim',
    description: 'Template SK pembentukan tim kerja/divisi',
    category: 'sk',
    googleDriveUrl: 'https://drive.google.com/open?id=10xscLjnMGZTLohv-Oxt9C4erPxcv5hRnfeO_zFxBnvM',
  },
  {
    id: 'sk-penetapan',
    name: 'Surat Keputusan Penetapan',
    description: 'Template SK penetapan kebijakan/kegiatan',
    category: 'sk',
    googleDriveUrl: 'https://drive.google.com/open?id=1mgDfodNEctCGXTJAkKfcq7PJ7YjK9CUeN0ZhAv7yUsw',
  },
  {
    id: 'sk-pengangkatan-pemberhentian',
    name: 'Surat Keputusan Pengangkatan/Pemberhentian',
    description: 'Template SK pengangkatan atau pemberhentian jabatan',
    category: 'sk',
    googleDriveUrl: 'https://drive.google.com/open?id=1a-c-z_FFEcoEWO7afDfuKbiFCj8Y_KC2AccRS3kykLQ',
  },

  // ═══════════════════════════════════════════
  // SURAT TUGAS & PERINTAH
  // ═══════════════════════════════════════════
  {
    id: 'surat-tugas',
    name: 'Surat Tugas (ST)',
    description: 'Template surat tugas resmi BEM FT',
    category: 'surat',
    googleDriveUrl: 'https://drive.google.com/open?id=17MiWIe-DOj3aoKLVtogs8hppsxBsTAHu5D6TSJOhezI',
  },
  {
    id: 'surat-perintah-tugas',
    name: 'Surat Perintah Tugas (SPT)',
    description: 'Template surat perintah tugas dari pimpinan BEM',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1HmzrCel6IUBDr5oQ5VAm--biuZJTQt5ofLFckYW-ABE/edit',
  },

  // ═══════════════════════════════════════════
  // SURAT KETERANGAN, PEMBERITAHUAN, NOTA
  // ═══════════════════════════════════════════
  {
    id: 'surat-keterangan',
    name: 'Surat Keterangan',
    description: 'Template surat keterangan aktif/kegiatan organisasi',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/186KPSygnV2HB4yi5SmlItPwb8XzYU_LqMuOlgrKuP0Q/edit',
  },
  {
    id: 'surat-pemberitahuan',
    name: 'Surat Pemberitahuan',
    description: 'Template surat pemberitahuan resmi BEM FT',
    category: 'surat',
    googleDriveUrl: 'https://docs.google.com/document/d/1SBBegqgyzFuOkqi-uAGVhbv7vx5_vTR2Y25kCoWKq60/edit',
  },
  {
    id: 'nota-dinas',
    name: 'Nota Dinas (Opsional)',
    description: 'Template nota dinas internal BEM FT',
    category: 'nota',
    googleDriveUrl: 'https://docs.google.com/document/d/1ZJCwRTUm6OR9eAXW552DFhu_kyBQDzAa/edit',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB...');
    const DocumentTemplate = mongoose.connection.collection('document_templates');
    
    let count = 0;
    for (let i = 0; i < suratTemplates.length; i++) {
      const tpl = suratTemplates[i];
      await DocumentTemplate.updateOne(
        { code: tpl.id },
        {
          $set: {
            code: tpl.id,
            name: tpl.name,
            documentType: tpl.category,
            category: 'internal', // Defaulting to internal for simplicity
            description: tpl.description,
            version: 1,
            status: 'published',
            sourceType: 'DOCX',
            googleDriveUrl: tpl.googleDriveUrl,
            order: i,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date(),
            workflow: []
          }
        },
        { upsert: true }
      );
      count++;
    }
    
    console.log(`✅ ${count} Document Templates seeded!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
