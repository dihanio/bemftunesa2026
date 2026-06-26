/**
 * BEM FT UNESA Berita Seeder
 *
 * Run with: npx ts-node --project tsconfig.json seeders/berita-seed.ts
 */

import 'reflect-metadata';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI as string;

// Use the same schema definitions as the main app
const ContentSeoSchema = new mongoose.Schema({
  metaTitle: String,
  metaDescription: String,
  keywords: { type: [String], default: [] },
  ogImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  canonicalUrl: String,
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['news', 'announcement', 'page', 'service'] },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  excerpt: String,
  content: String,
  status: { type: String, required: true, enum: ['draft', 'review', 'published', 'archived'], default: 'draft' },
  featuredImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  seo: { type: ContentSeoSchema, default: () => ({}) },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publishedAt: Date,
  tags: { type: [String], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

async function seedBerita() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const Content = mongoose.model('Content', ContentSchema);
  const User = mongoose.model('User', new mongoose.Schema({ email: String }));

  // Find any user to be the author
  const superAdmin = await User.findOne();
  if (!superAdmin) {
    console.error('Super Admin not found. Run cms-seed.ts first.');
    process.exit(1);
  }

  console.log('Clearing old news data...');
  await Content.deleteMany({ type: 'news' });

  console.log('Seeding news data...');
  const newsData = [
    {
      type: 'news',
      title: 'Pelantikan Pengurus BEM FT UNESA 2026',
      slug: 'pelantikan-pengurus-bem-ft-unesa-2026',
      excerpt: 'Rangkaian acara pelantikan pengurus baru BEM FT UNESA periode 2026 berjalan dengan khidmat dan lancar.',
      content: '<p>Pada hari ini, pengurus baru Badan Eksekutif Mahasiswa Fakultas Teknik (BEM FT) Universitas Negeri Surabaya resmi dilantik. Acara pelantikan ini dihadiri oleh jajaran dekanat, perwakilan ormawa, dan seluruh pengurus terpilih.</p><p>Dengan semangat Sinergi Nyata, Teknik Berdaya, kabinet tahun ini siap membawa perubahan positif bagi seluruh mahasiswa Fakultas Teknik.</p>',
      status: 'published',
      author: superAdmin._id,
      publishedAt: new Date(),
      tags: ['Pelantikan', 'BEM FT', 'Kegiatan'],
      seo: {
        metaTitle: 'Pelantikan Pengurus BEM FT UNESA 2026',
        metaDescription: 'Berita pelantikan pengurus BEM FT UNESA periode 2026.',
        keywords: ['Pelantikan', 'BEM FT', 'UNESA'],
        canonicalUrl: '',
      }
    },
    {
      type: 'news',
      title: 'Open Recruitment Kepanitiaan PKKMB FT 2026',
      slug: 'open-recruitment-kepanitiaan-pkkmb-ft-2026',
      excerpt: 'Telah dibuka pendaftaran untuk menjadi bagian dari panitia Pengenalan Kehidupan Kampus bagi Mahasiswa Baru (PKKMB) Fakultas Teknik tahun 2026.',
      content: '<p>Halo Ksatria Teknik! Panggilan untuk kalian yang ingin berkontribusi menyambut mahasiswa baru Fakultas Teknik. Pendaftaran panitia PKKMB FT 2026 resmi dibuka mulai hari ini.</p><p>Segera daftarkan diri kalian melalui tautan yang tersedia di bio Instagram resmi BEM FT UNESA.</p>',
      status: 'published',
      author: superAdmin._id,
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      tags: ['Oprec', 'PKKMB', 'Mahasiswa Baru'],
      seo: {
        metaTitle: 'Open Recruitment Panitia PKKMB FT 2026',
        metaDescription: 'Informasi pendaftaran panitia PKKMB Fakultas Teknik UNESA 2026.',
        keywords: ['Oprec', 'PKKMB', 'FT UNESA'],
        canonicalUrl: '',
      }
    },
    {
      type: 'news',
      title: 'Diskusi Publik: Tantangan Insinyur Muda di Era Digital',
      slug: 'diskusi-publik-tantangan-insinyur-muda-di-era-digital',
      excerpt: 'Departemen PSDM BEM FT UNESA mengadakan diskusi publik yang mengupas tuntas tantangan dan peluang insinyur muda.',
      content: '<p>Era digital membawa banyak perubahan dan menuntut adaptasi cepat dari berbagai profesi, tak terkecuali bagi insinyur muda. Untuk itu, BEM FT UNESA sukses menggelar Diskusi Publik yang menghadirkan narasumber inspiratif dari kalangan profesional dan akademisi.</p><p>Antusiasme mahasiswa sangat tinggi terlihat dari banyaknya peserta yang aktif berdiskusi selama acara berlangsung.</p>',
      status: 'published',
      author: superAdmin._id,
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      tags: ['Diskusi Publik', 'PSDM', 'Akademik'],
      seo: {
        metaTitle: 'Diskusi Publik Insinyur Muda BEM FT',
        metaDescription: 'Liputan kegiatan diskusi publik BEM FT UNESA membahas tantangan insinyur muda di era digital.',
        keywords: ['Diskusi', 'Insinyur Muda', 'Era Digital'],
        canonicalUrl: '',
      }
    }
  ];

  for (const item of newsData) {
    await Content.create(item);
  }

  console.log(`Successfully seeded ${newsData.length} news items.`);

  await mongoose.disconnect();
  console.log('Database disconnected.');
}

seedBerita().catch((err) => {
  console.error('Error seeding news:', err);
  process.exit(1);
});
