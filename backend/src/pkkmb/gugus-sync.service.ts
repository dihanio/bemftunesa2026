import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { PkkmbGroup, PkkmbGroupDocument } from '../schemas/pkkmb-group.schema';

/**
 * Mapping gid (Google Sheets) -> nama gugus.
 * Diambil dari spreadsheet publik "PEMBAGIAN GUGUS ADRATA FT UNESA 2026".
 */
const SHEET_GID_MAP: Record<string, string> = {
  '1820850023': 'Aceh Darussalam',
  '2038431399': 'Aru',
  '1875678944': 'Bacan',
  '1974708020': 'Banggai',
  '1781373494': 'Banjar',
  '779728010': 'Banten',
  '37074619': 'Blambangan',
  '1852399227': 'Bone',
  '319909175': 'Bulungan',
  '1599174782': 'Buton',
  '815695513': 'Cirebon',
  '1379149142': 'Demak',
  '594095560': 'Dharmasraya',
  '1809529894': 'Galuh',
  '1782536450': 'Gowa',
  '657089139': 'Indrapura',
  '1536971865': 'Jailolo',
  '1147271865': 'Janggala',
  '708402861': 'Kahuripan',
  '22424836': 'Kalingga',
  '1789750465': 'Kandis',
  '1146054959': 'Kanjuruhan',
  '190137035': 'Kediri',
  '637395886': 'Konawe',
  '350107394': 'Kutai',
  '213889695': 'Kutai Kartanegara',
  '199299057': 'Kutaringin',
  '613501359': 'Lamuri',
  '136286001': 'Lingga',
  '494549193': 'Luwu',
  '1531861912': 'Majapahit',
  '1917070935': 'Mataram',
  '285089061': 'Medang',
  '1625841547': 'Melayu',
  '1045543584': 'Pagaruyung',
  '1300208181': 'Pajajaran',
  '668782064': 'Pajang',
  '2042846788': 'Panjalu',
  '224689676': 'Salakanagara',
  '1249019437': 'Sambas',
  '393089835': 'Selaparang',
  '1599216327': 'Siak',
  '212448774': 'Singasari',
  '1781209491': 'Soppeng',
  '1249700740': 'Sriwijaya',
  '925895480': 'Sunda Galuh',
  '1532461020': 'Tarumanegara',
  '29454293': 'Ternate',
  '540455697': 'Tidore',
  '1639325708': 'Wajo',
};

interface SheetMaba {
  nim: string;
  name: string;
  jk: string;
  prodi: string;
  gugus: string;
}

@Injectable()
export class GugusSyncService {
  private readonly logger = new Logger(GugusSyncService.name);
  private readonly sheetId: string;
  private readonly syncEnabled: boolean;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(PkkmbGroup.name)
    private readonly groupModel: Model<PkkmbGroupDocument>,
    private readonly configService: ConfigService,
  ) {
    // Dari URL publish: https://docs.google.com/spreadsheets/d/e/{ID}/pubhtml
    this.sheetId = this.configService.get<string>(
      'GUGUS_SHEET_ID',
      '2PACX-1vTBHr42QiqdZYT1-g6ypk8RnyCUn2pFHisu3fp6rx4d4YK6I5WvOO1cjw9WBZYMRf44QRsVSM6NUmr1',
    );
    this.syncEnabled =
      this.configService.get<string>('GUGUS_SYNC_ENABLED', 'true') === 'true';
  }

  /**
   * Ambil CSV mentah dari Google Sheets untuk sebuah gid.
   */
  private async fetchCsv(gid: string): Promise<string> {
    const url = `https://docs.google.com/spreadsheets/d/e/${this.sheetId}/pub?output=csv&gid=${gid}`;
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      throw new Error(`Gagal fetch CSV gid=${gid}: HTTP ${res.status}`);
    }
    return res.text();
  }

  /**
   * Parse CSV sederhana (mendukung kutip ganda).
   */
  private parseCsv(csv: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
      const ch = csv[i];
      if (inQuotes) {
        if (ch === '"') {
          if (csv[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && csv[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        if (row.some((c) => c.trim() !== '')) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    if (field !== '' || row.length > 0) {
      row.push(field);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
    }
    return rows;
  }

  /**
   * Ambil data semua gugus dari Google Sheets.
   */
  async fetchAllGugus(): Promise<SheetMaba[]> {
    const result: SheetMaba[] = [];
    for (const [gid, gugus] of Object.entries(SHEET_GID_MAP)) {
      try {
        const csv = await this.fetchCsv(gid);
        const rows = this.parseCsv(csv);
        // skip header row (NO,NIM,NAMA LENGKAP,...)
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const nim = (r[1] || '').trim();
          if (!nim) continue;
          result.push({
            nim,
            name: (r[2] || '').trim(),
            jk: (r[3] || '').trim(),
            prodi: (r[4] || '').trim(),
            gugus,
          });
        }
      } catch (err) {
        this.logger.error(
          `Gagal fetch gugus ${gugus} (gid=${gid}): ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(
      `Google Sheets: total ${result.length} maba dari ${Object.keys(SHEET_GID_MAP).length} gugus.`,
    );
    return result;
  }

  /**
   * Sinkronkan data maba dari Google Sheets ke database (upsert).
   */
  async syncToDatabase(): Promise<{
    updated: number;
    created: number;
    skipped: number;
    total: number;
  }> {
    const sheetMaba = await this.fetchAllGugus();
    const roleMaba = await this.roleModel.findOne({
      $or: [{ slug: 'user' }, { slug: 'maba' }],
    });
    if (!roleMaba) {
      throw new Error('Role maba tidak ditemukan');
    }

    // Map nama gugus -> _id
    const gugusMap = new Map<string, string>();
    const groups = await this.groupModel.find({ deletedAt: null });
    for (const g of groups) {
      gugusMap.set(g.name, g._id.toString());
    }

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const sm of sheetMaba) {
      const gid = gugusMap.get(sm.gugus);
      if (!gid) {
        skipped++;
        continue;
      }
      const groupObjId = gid as unknown as typeof User.prototype.pkkmbGroup;

      // Cari user via NIM atau email prefix (nim@mhs.unesa.ac.id)
      const email = `${sm.nim}@mhs.unesa.ac.id`;
      const user = await this.userModel.findOne({
        $or: [{ nim: sm.nim }, { email }],
        deletedAt: null,
      });

      if (user) {
        // Update
        const patch: Record<string, unknown> = {
          pkkmbGroup: groupObjId,
          name: sm.name,
          studyProgram: sm.prodi,
          gender: sm.jk === 'P' ? 'P' : 'L',
          assignmentStatus: 'ASSIGNED',
        };
        // Perbaiki NIM jika berbeda
        if (user.nim !== sm.nim) patch.nim = sm.nim;
        await this.userModel.updateOne({ _id: user._id }, { $set: patch });
        updated++;
      } else {
        // Insert baru (isOnboarded=false agar tetap disuruh onboarding)
        await this.userModel.create({
          cabinetPeriod: '2026',
          name: sm.name,
          email,
          gender: sm.jk === 'P' ? 'P' : 'L',
          position: 'Mahasiswa Baru',
          isOnboarded: false,
          role: roleMaba._id,
          announcementsRead: [],
          isKetuaGugus: false,
          isActive: true,
          isEmailVerified: false,
          emailVerifyAttempts: 0,
          emailResendCount: 0,
          verificationStatus: 'PENDING_VERIFICATION',
          assignmentStatus: 'ASSIGNED',
          nim: sm.nim,
          studyProgram: sm.prodi,
          pkkmbGroup: groupObjId,
        });
        created++;
      }
    }

    this.logger.log(
      `Sync Google Sheets -> DB selesai: updated=${updated}, created=${created}, skipped=${skipped}`,
    );
    return { updated, created, skipped, total: sheetMaba.length };
  }

  /**
   * Jadwal otomatis berkala (default setiap 6 jam). Nonaktif via GUGUS_SYNC_ENABLED=false.
   */
  @Cron('0 */6 * * *', { name: 'gugus-sheets-sync' })
  async handleCronSync(): Promise<void> {
    if (!this.syncEnabled) {
      this.logger.log(
        'Sync Google Sheets dinonaktifkan (GUGUS_SYNC_ENABLED=false).',
      );
      return;
    }
    try {
      await this.syncToDatabase();
    } catch (err) {
      this.logger.error(`Cron sync gagal: ${(err as Error).message}`);
    }
  }
}
