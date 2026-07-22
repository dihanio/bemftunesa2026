import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Letter, LetterDocument } from '../schemas/letter.schema';
import {
  CreateLetterDto,
  UpdateLetterDto,
  QueryLetterDto,
} from './dto/letter.dto';
import {
  ROLES_BPI,
  ROLE_SEKRETARIS_ADMINISTRASI,
  ROLE_SEKRETARIS_KEGIATAN,
} from '../common/constants/roles';

@Injectable()
export class LettersService {
  constructor(
    @InjectModel(Letter.name) private letterModel: Model<LetterDocument>,
  ) {}

  async findAll(
    query: QueryLetterDto,
    userRole: string,
    userDepartment?: string,
  ) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.department) filter.department = query.department;

    // RBAC filtering
    // Staff/Kadep can only see their department's letters (unless it's an incoming letter directed to them)
    if (!(ROLES_BPI as readonly string[]).includes(userRole)) {
      if (userDepartment) {
        filter.department = userDepartment;
      }
    } else {
      if (userRole === ROLE_SEKRETARIS_ADMINISTRASI && !query.type) {
        filter.type = { $in: ['incoming', 'outgoing'] };
      } else if (userRole === ROLE_SEKRETARIS_KEGIATAN && !query.type) {
        filter.type = { $in: ['proposal', 'lpj'] };
      }
    }

    const data = await this.letterModel
      .find(filter)
      .populate('department', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .exec();

    return { data };
  }

  async findById(id: string) {
    const letter = await this.letterModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('department', 'name code')
      .populate('createdBy', 'name')
      .exec();
    if (!letter) throw new NotFoundException('Letter not found');
    return letter;
  }

  async create(dto: CreateLetterDto, userId: string, userDepartment?: string) {
    const letter = await this.letterModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
      department:
        userDepartment || dto.department
          ? new Types.ObjectId(userDepartment || dto.department)
          : undefined,
      status: dto.type === 'incoming' ? 'approved' : 'draft', // Incoming letters are automatically approved
    });

    return letter;
  }

  async update(
    id: string,
    dto: UpdateLetterDto,
    userRole: string,
    userDepartment?: string,
  ) {
    const letter = await this.findById(id);

    // RBAC checking
    const isBPI = (ROLES_BPI as readonly string[]).includes(userRole);
    if (
      !isBPI &&
      userDepartment &&
      (letter.department as { toString(): string })?.toString() !==
        userDepartment
    ) {
      throw new ForbiddenException(
        'You can only edit letters from your own department',
      );
    }

    // Logic for Auto-Increment Reference Number when approved
    if (
      dto.status === 'approved' &&
      letter.status !== 'approved' &&
      ['outgoing', 'proposal', 'lpj'].includes(letter.type)
    ) {
      // Generate reference number
      // Format: [NUMBER]/[DEPT_CODE]/BEM-FT/UNESA/[ROMAN_MONTH]/[YEAR]
      const now = new Date();
      const monthRoman = [
        'I',
        'II',
        'III',
        'IV',
        'V',
        'VI',
        'VII',
        'VIII',
        'IX',
        'X',
        'XI',
        'XII',
      ][now.getMonth()];
      const year = now.getFullYear();

      // Find the highest number for this type and year
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);

      const lastLetter = await this.letterModel
        .findOne({
          type: letter.type,
          referenceNumber: { $exists: true },
          dateApproved: { $gte: startOfYear, $lte: endOfYear },
        })
        .sort({ dateApproved: -1 })
        .exec();

      let nextNum = 1;
      if (lastLetter && lastLetter.referenceNumber) {
        const parts = lastLetter.referenceNumber.split('/');
        const lastNumStr = parts[0];
        if (!isNaN(Number(lastNumStr))) {
          nextNum = Number(lastNumStr) + 1;
        }
      }

      // Department Code
      let deptCode = 'BEM'; // Default
      if (letter.department) {
        // Since it's populated in findById, we can access the code
        const dept = letter.department as { code?: string };
        if (dept.code) {
          deptCode = dept.code.toUpperCase();
        }
      }

      const paddedNum = nextNum.toString().padStart(3, '0');

      let typeCode = '';
      if (letter.type === 'proposal') typeCode = 'PROP/';
      if (letter.type === 'lpj') typeCode = 'LPJ/';

      letter.referenceNumber = `${paddedNum}/${typeCode}${deptCode}/BEM-FT/UNESA/${monthRoman}/${year}`;
      letter.dateApproved = now;
    }

    if (dto.status) letter.status = dto.status;
    if (dto.subject) letter.subject = dto.subject;
    if (dto.sender) letter.sender = dto.sender;
    if (dto.recipient) letter.recipient = dto.recipient;
    if (dto.documentUrl) letter.documentUrl = dto.documentUrl;
    if (dto.approvalNotes) letter.approvalNotes = dto.approvalNotes;
    if (dto.deadlineDate) letter.deadlineDate = new Date(dto.deadlineDate);
    if (dto.impactScale) letter.impactScale = dto.impactScale;
    if (dto.urgencyLevel) letter.urgencyLevel = dto.urgencyLevel;

    return letter.save();
  }

  async delete(id: string) {
    const letter = await this.findById(id);
    letter.deletedAt = new Date();
    await letter.save();
    return { deleted: true };
  }

  // --- DSS SMART (Simple Multi Attribute Rating Technique) ---
  async calculateSmartPriority() {
    const filter: Record<string, unknown> = {
      deletedAt: { $exists: false },
      status: { $in: ['draft', 'review_kadep', 'review_ketua'] },
    };

    const letters = await this.letterModel
      .find(filter)
      .populate('department', 'name code')
      .populate('createdBy', 'name')
      .exec();

    if (letters.length === 0) return { success: true, data: [], weights: {} };

    // SMART Step 1: Definisikan Bobot Kriteria (W)
    // C1: Sisa Waktu / Deadline (Benefit) 35%
    // C2: Skala Dampak (Benefit) 25%
    // C3: Tingkat Kepentingan (Benefit) 20%
    // C4: Lama Mengendap (Benefit) 20%
    const weights = { c1: 0.35, c2: 0.25, c3: 0.2, c4: 0.2 };

    const now = new Date().getTime();

    // SMART Step 2: Konversi Atribut ke Nilai Numerik (Utility)
    const matrix = letters.map((letter) => {
      // C1: Sisa hari menuju deadline (semakin dekat = semakin urgent = nilai tinggi)
      let c1 = 1;
      if (letter.deadlineDate) {
        const daysLeft = Math.floor(
          (new Date(letter.deadlineDate).getTime() - now) /
            (1000 * 60 * 60 * 24),
        );
        // Inverse: semakin sedikit sisa hari, semakin besar nilainya
        if (daysLeft <= 0)
          c1 = 100; // Sudah lewat deadline
        else if (daysLeft <= 3) c1 = 80;
        else if (daysLeft <= 7) c1 = 60;
        else if (daysLeft <= 14) c1 = 40;
        else if (daysLeft <= 30) c1 = 20;
        else c1 = 10;
      }

      // C2: Skala Dampak
      const impactMap: Record<string, number> = {
        internal: 1,
        fakultas: 2,
        universitas: 3,
        eksternal: 4,
      };
      const c2 = impactMap[letter.impactScale] || 1;

      // C3: Tingkat Kepentingan
      const urgencyMap: Record<string, number> = {
        normal: 1,
        high: 2,
        urgent: 3,
      };
      const c3 = urgencyMap[letter.urgencyLevel] || 1;

      // C4: Lama mengendap pada status saat ini (hari sejak terakhir diupdate)
      const stagnancyTime = letter.updatedAt
        ? new Date(letter.updatedAt).getTime()
        : now;
      let c4 = Math.floor((now - stagnancyTime) / (1000 * 60 * 60 * 24));
      if (c4 <= 0) c4 = 1;

      return { id: letter._id, letter, c1, c2, c3, c4 };
    });

    // SMART Step 3: Normalisasi Utility (0-1)
    // Rumus SMART: u(ai) = (Cmax - Cout) / (Cmax - Cmin) untuk Cost
    //              u(ai) = (Cout - Cmin) / (Cmax - Cmin) untuk Benefit
    // Semua kriteria Benefit
    const minC1 = Math.min(...matrix.map((x) => x.c1));
    const maxC1 = Math.max(...matrix.map((x) => x.c1));
    const minC2 = Math.min(...matrix.map((x) => x.c2));
    const maxC2 = Math.max(...matrix.map((x) => x.c2));
    const minC3 = Math.min(...matrix.map((x) => x.c3));
    const maxC3 = Math.max(...matrix.map((x) => x.c3));
    const minC4 = Math.min(...matrix.map((x) => x.c4));
    const maxC4 = Math.max(...matrix.map((x) => x.c4));

    const safeDiv = (num: number, den: number) => (den === 0 ? 1 : num / den);

    const normalized = matrix.map((x) => ({
      id: x.id,
      u1: safeDiv(x.c1 - minC1, maxC1 - minC1),
      u2: safeDiv(x.c2 - minC2, maxC2 - minC2),
      u3: safeDiv(x.c3 - minC3, maxC3 - minC3),
      u4: safeDiv(x.c4 - minC4, maxC4 - minC4),
    }));

    // SMART Step 4: Hitung Nilai Akhir (V = sum(w * u))
    const finalScores = normalized.map((u) => {
      const v =
        u.u1 * weights.c1 +
        u.u2 * weights.c2 +
        u.u3 * weights.c3 +
        u.u4 * weights.c4;
      const original = matrix.find((m) => m.id === u.id);
      return {
        letter: original?.letter,
        matrix: {
          c1: original?.c1,
          c2: original?.c2,
          c3: original?.c3,
          c4: original?.c4,
        },
        normalized: { u1: u.u1, u2: u.u2, u3: u.u3, u4: u.u4 },
        score: Math.round(v * 1000) / 1000,
      };
    });

    finalScores.sort((a, b) => b.score - a.score);

    return { success: true, data: finalScores, weights };
  }

  async getStats() {
    const filter = { deletedAt: { $exists: false } };

    const total = await this.letterModel.countDocuments(filter);
    const pending = await this.letterModel.countDocuments({
      ...filter,
      status: 'pending',
    });
    const approved = await this.letterModel.countDocuments({
      ...filter,
      status: 'approved',
    });
    const rejected = await this.letterModel.countDocuments({
      ...filter,
      status: 'rejected',
    });

    return {
      total: { label: 'Total Surat', value: total },
      pending: {
        label: 'Menunggu Persetujuan',
        value: pending,
        color: 'warning' as const,
      },
      approved: {
        label: 'Disetujui',
        value: approved,
        color: 'success' as const,
      },
      rejected: { label: 'Ditolak', value: rejected, color: 'danger' as const },
    };
  }
}
