import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import {
  StudyProgram,
  StudyProgramDocument,
} from '../schemas/study-program.schema';

export interface KtmsOcrResult {
  name: string;
  nim: string;
  faculty: string;
  studyProgram: string;
  address: string;
  rawText: string;
}

const FAKULTAS_RE = /fakultas\s*teknik/i;

@Injectable()
export class KtmsOcrService {
  constructor(
    @InjectModel(StudyProgram.name)
    private studyProgramModel: Model<StudyProgramDocument>,
  ) {}

  async recognize(imageBuffer: Buffer): Promise<KtmsOcrResult> {
    // Preprocess: grayscale + upscale untuk akurasi OCR.
    let processed: Buffer;
    try {
      processed = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .resize({ width: 1600, withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Gambar tidak valid atau tidak dapat dibaca.',
      );
    }

    // Load daftar prodi FT UNESA dari master data.
    const prodiMaster = await this.studyProgramModel
      .find({ isActive: true })
      .select('name code')
      .lean()
      .exec();
    const prodiNames = prodiMaster.map((p) => p.name.toLowerCase());

    let rawText = '';
    try {
      const worker = await createWorker('ind');
      const { data } = await worker.recognize(processed);
      rawText = data.text || '';
      await worker.terminate();
    } catch {
      throw new BadRequestException(
        'Gagal membaca teks dari gambar. Pastikan foto KTMS jelas dan tidak buram.',
      );
    }

    return this.parse(rawText, prodiNames);
  }

  private parse(rawText: string, prodiNames: string[]): KtmsOcrResult {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // Ambil nilai setelah label (mis. "Nama : Diha Anfeu") — format umum KTMS.
    const valueAfter = (label: RegExp): string => {
      for (const line of lines) {
        const m = line.match(label);
        if (m) {
          // Tangkap sisa baris setelah label (opsional ":").
          const idx = line.indexOf(m[0]);
          const rest = line.slice(idx + m[0].length).replace(/^[\s:.-]+/, '');
          if (rest) return rest;
          return '';
        }
      }
      return '';
    };

    // NIM: 8-10 digit (format NIM UNESA bervariasi).
    let nim = valueAfter(/nim/i);
    if (!nim) {
      for (const line of lines) {
        const m = line.match(/\b\d{8,10}\b/);
        if (m) {
          nim = m[0];
          break;
        }
      }
    } else {
      const m = nim.match(/\d{8,10}/);
      nim = m ? m[0] : '';
    }

    // Nama: dari label "Nama"; fallback baris nama (2-5 kata, bukan keyword).
    let name = valueAfter(/nama/i);
    if (!name) {
      const skipRe =
        /(univ|fakultas|teknik|nim|nama|alamat|prodi|program|studi|kelas|semester|q[rv]|ktm|ktms)/i;
      for (const line of lines) {
        const words = line.split(/\s+/);
        if (
          words.length >= 2 &&
          words.length <= 5 &&
          !line.match(/\d{8,10}/) &&
          !skipRe.test(line) &&
          /^[A-Za-z .'’-]+$/.test(line)
        ) {
          name = line;
          break;
        }
      }
    }

    // Program studi: cocokkan line dgn master data prodi; ambil nilai setelah label.
    let studyProgram = valueAfter(/program\s*studi/i);
    const lowerProdi = studyProgram.toLowerCase();
    const matched = prodiNames.find((pn) => lowerProdi.includes(pn));
    if (matched) {
      studyProgram = prodiMasterName(matched);
    } else {
      // Cari di semua baris.
      for (const line of lines) {
        const lo = line.toLowerCase();
        const m = prodiNames.find((pn) => lo.includes(pn));
        if (m) {
          studyProgram = prodiMasterName(m);
          break;
        }
      }
    }

    // Fakultas: garis mengandung "Fakultas Teknik".
    const faculty = rawText.match(FAKULTAS_RE)?.toString() || 'Fakultas Teknik';

    // Alamat: nilai setelah label "Alamat"; fallback baris berisi alamat.
    let address = valueAfter(/alamat/i);
    if (!address) {
      for (const line of lines) {
        if (
          /(^|[\s.,])j[l]/i.test(line) ||
          /(desa|kecamatan|kabupaten|kota|rt\.|rw\.)/i.test(line)
        ) {
          address = line;
          break;
        }
      }
    }

    if (!nim || !name) {
      throw new BadRequestException(
        'Tidak dapat membaca NIM dan nama dari KTMS. Periksa kembali foto atau isi manual.',
      );
    }

    return { name, nim, faculty, studyProgram, address, rawText };
  }
}

// Helper: kembalikan nama prodi dengan kapitalisasi yang benar.
function prodiMasterName(matchedLower: string): string {
  return matchedLower
    .split(' ')
    .map((w) =>
      w === 's1' || w === 's2' || w === 'd4' || w === 'd3'
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(' ');
}
