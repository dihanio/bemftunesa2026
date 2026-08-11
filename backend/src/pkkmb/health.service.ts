import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Redis from 'ioredis';

import { User, UserDocument } from '../schemas/user.schema';
import {
  HealthProfile,
  HealthProfileDocument,
} from '../schemas/health-profile.schema';
import {
  HealthRecord,
  HealthRecordDocument,
} from '../schemas/health-record.schema';
import {
  HealthCondition,
  HealthConditionDocument,
  RiskLevel,
} from '../schemas/health-condition.schema';
import {
  OnboardingConsent,
  OnboardingConsentDocument,
} from '../schemas/onboarding-consent.schema';
import { PkkmbGroup, PkkmbGroupDocument } from '../schemas/pkkmb-group.schema';
import {
  UpsertHealthProfileDto,
  CreateHealthConditionDto,
  OnboardingConsentDto,
} from './dto/health.dto';
import {
  pickBestGugus,
  buildCountsByGugus,
  CountAggRow,
  GenderCountAggRow,
} from './gugus-assignment';

const RISK_ORDER: Record<RiskLevel, number> = {
  RENDAH: 0,
  SEDANG: 1,
  TINGGI: 2,
};

@Injectable()
export class HealthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(HealthProfile.name)
    private profileModel: Model<HealthProfileDocument>,
    @InjectModel(HealthRecord.name)
    private recordModel: Model<HealthRecordDocument>,
    @InjectModel(HealthCondition.name)
    private conditionModel: Model<HealthConditionDocument>,
    @InjectModel(OnboardingConsent.name)
    private consentModel: Model<OnboardingConsentDocument>,
    @InjectModel(PkkmbGroup.name)
    private groupModel: Model<PkkmbGroupDocument>,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  // ── MASTER CONDITIONS (admin / tim kesehatan) ──────────────

  async listConditions() {
    return this.conditionModel.find().sort({ name: 1 }).lean().exec();
  }

  async createCondition(dto: CreateHealthConditionDto) {
    const existing = await this.conditionModel
      .findOne({ name: dto.name.trim() })
      .lean();
    if (existing) {
      throw new BadRequestException('Nama penyakit sudah ada di master data.');
    }
    const created = await this.conditionModel.create(dto);
    await this.redis.del('pkkmb:health:conditions').catch(() => {});
    return created;
  }

  async deleteCondition(id: string) {
    const result = await this.conditionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Penyakit tidak ditemukan.');
    await this.redis.del('pkkmb:health:conditions').catch(() => {});
    return { success: true };
  }

  // ── OWN PROFILE (maba) ─────────────────────────────────────

  async getMyProfile(userId: string) {
    const [profile, records, consent] = await Promise.all([
      this.profileModel.findOne({ studentId: userId }).lean().exec(),
      this.recordModel
        .find({ studentId: userId })
        .populate('conditionId', 'name category riskLevel')
        .lean()
        .exec(),
      this.consentModel.findOne({ studentId: userId }).lean().exec(),
    ]);

    // Pita NON-SENSITIF: hanya warna, TANPA diagnosis apa pun. Tim medis
    // sudah mengetahui rincian kondisi; maba cukup tahu warna pita yang harus
    // dikenakan. Diturunkan dari agregat risk level:
    //   TINGGI → Pita Merah, SEDANG → Pita Kuning, RENDAH → tidak perlu pita.
    const ribbon =
      profile?.overallRiskLevel === 'TINGGI'
        ? 'MERAH'
        : profile?.overallRiskLevel === 'SEDANG'
          ? 'KUNING'
          : null;

    return {
      ribbon,
      hasMedicalHistory: profile?.hasMedicalHistory ?? false,
      isDisabled: profile?.isDisabled ?? false,
      disabilityDescription: profile?.disabilityDescription ?? null,
      bpjsNumber: profile?.bpjsNumber ?? null,
      bpjsStatus: profile?.bpjsStatus ?? null,
      emergencyContact: profile
        ? {
            name: profile.emergencyContactName,
            relation: profile.emergencyContactRelation,
            phone: profile.emergencyContactPhone,
          }
        : null,
      overallRiskLevel: profile?.overallRiskLevel ?? 'RENDAH',
      records: (records || []).map((r) => ({
        id: r._id.toString(),
        name: (r.conditionId as unknown as { name?: string })?.name || '',
        category:
          (r.conditionId as unknown as { category?: string })?.category || '',
        riskLevel:
          (r.conditionId as unknown as { riskLevel?: RiskLevel })?.riskLevel ||
          'RENDAH',
        yearStart: r.yearStart,
        conditionStatus: r.conditionStatus,
        needsMedication: r.needsMedication,
        notes: r.notes,
      })),
      consentCompleted: !!consent,
      consentedAt: consent?.consentedAt ?? null,
    };
  }

  // Klasifikasi risiko: pakai tingkat risiko tertinggi dari master kondisi.
  private computeRiskLevel(riskLevels: RiskLevel[]): RiskLevel {
    if (riskLevels.length === 0) return 'RENDAH';
    return riskLevels.reduce((acc, cur) =>
      RISK_ORDER[cur] > RISK_ORDER[acc] ? cur : acc,
    );
  }

  async upsertProfile(userId: string, dto: UpsertHealthProfileDto) {
    if (dto.isDisabled && !dto.disabilityDescription?.trim()) {
      throw new BadRequestException(
        'Keterangan jenis disabilitas wajib diisi.',
      );
    }
    const profile = await this.profileModel.findOne({ studentId: userId });

    // Resolve each record to a master condition id.
    const conditionIds: Types.ObjectId[] = [];
    for (const rec of dto.records || []) {
      let cond = await this.conditionModel.findOne({
        name: rec.name.trim(),
      });
      if (!cond) {
        // Auto-create minimal master jika belum ada.
        cond = await this.conditionModel.create({
          name: rec.name.trim(),
          category: rec.category || 'Lainnya',
          riskLevel: 'RENDAH',
        });
      }
      conditionIds.push(cond._id);
    }

    // Simpan records: hapus semua lalu buat ulang (idempotent, sederhana).
    await this.recordModel.deleteMany({ studentId: userId });
    const recordDocs = conditionIds.map((cid, i) => {
      const rec = (dto.records || [])[i];
      return {
        studentId: new Types.ObjectId(userId),
        conditionId: cid,
        yearStart: rec.yearStart,
        conditionStatus: rec.conditionStatus || 'Masih aktif',
        needsMedication: rec.needsMedication ?? false,
        notes: rec.notes,
      };
    });
    if (recordDocs.length > 0) {
      await this.recordModel.insertMany(recordDocs);
    }

    // Klasifikasi risiko keseluruhan dari kondisi yang dipilih.
    const conditions = await this.conditionModel
      .find({ _id: { $in: conditionIds } })
      .select('riskLevel')
      .lean();
    const riskLevel = this.computeRiskLevel(conditions.map((c) => c.riskLevel));

    const payload = {
      studentId: new Types.ObjectId(userId),
      hasMedicalHistory: dto.hasMedicalHistory,
      isDisabled: dto.isDisabled ?? false,
      disabilityDescription: dto.isDisabled
        ? dto.disabilityDescription || undefined
        : undefined,
      bpjsNumber: dto.bpjsNumber || undefined,
      bpjsStatus: dto.bpjsStatus || undefined,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactRelation: dto.emergencyContactRelation,
      emergencyContactPhone: dto.emergencyContactPhone,
      overallRiskLevel: riskLevel,
    };

    if (profile) {
      Object.assign(profile, payload);
      await profile.save();
    } else {
      await this.profileModel.create(payload);
    }

    return this.getMyProfile(userId);
  }

  // ── CONSENT + FINALIZE ONBOARDING ─────────────────────────

  async completeConsent(userId: string, dto: OnboardingConsentDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // Validasi ulang: data wajib onboarding harus sudah ada.
    if (
      !user.nim ||
      !user.name ||
      !user.studyProgram ||
      !user.gender ||
      !user.phone
    ) {
      throw new BadRequestException(
        'Data profil belum lengkap. Lengkapi onboarding terlebih dahulu.',
      );
    }

    // Tanda tangan wajib non-empty.
    if (!dto.signature || dto.signature.trim() === '') {
      throw new BadRequestException('Tanda tangan tidak boleh kosong.');
    }

    const now = new Date();
    await this.consentModel.findOneAndUpdate(
      { studentId: userId },
      {
        $set: {
          studentId: new Types.ObjectId(userId),
          statementVersion: dto.statementVersion,
          statementText: dto.statementText,
          signature: dto.signature,
          consentedAt: now,
          completedAt: now,
        },
      },
      { upsert: true, new: true },
    );

    // Finalisasi onboarding: set status & assign gugus.
    if (!user.isOnboarded) {
      user.isOnboarded = true;
      user.verificationStatus = 'PENDING_VERIFICATION';
      user.assignmentStatus = 'UNASSIGNED';
      await user.save();
      try {
        await this.assignMabaToGroup(user);
      } catch {
        /* non-fatal */
      }
    }

    await user.populate('pkkmbGroup', '_id nomor name');

    return {
      success: true,
      completedAt: now,
      group: user.pkkmbGroup ?? null,
    };
  }

  // Salin dari PkkmbService.assignMabaToGroup (balanced: prodi → genderGap → total).
  private async assignMabaToGroup(user: UserDocument) {
    const activeGugus = await this.groupModel
      .find({ status: 'ACTIVE', deletedAt: null })
      .select('_id nomor')
      .sort({ nomor: 1 })
      .lean()
      .exec();
    if (activeGugus.length === 0) return false;

    const groupIds = activeGugus.map((g) => g._id);
    const prodi = user.studyProgram || null;
    const gender = user.gender || 'L';

    // Hitung per gugus: total, sesama prodi, sesama prodi+gender, dan
    // jumlah cowo/cewe (untuk genderGapN global).
    const [totalAgg, prodiAgg, genderProdiAgg, genderAgg] = await Promise.all([
      this.userModel.aggregate([
        { $match: { pkkmbGroup: { $in: groupIds }, deletedAt: null } },
        { $group: { _id: '$pkkmbGroup', n: { $sum: 1 } } },
      ]),
      prodi
        ? this.userModel.aggregate([
            {
              $match: {
                pkkmbGroup: { $in: groupIds },
                deletedAt: null,
                studyProgram: prodi,
              },
            },
            { $group: { _id: '$pkkmbGroup', n: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      prodi
        ? this.userModel.aggregate([
            {
              $match: {
                pkkmbGroup: { $in: groupIds },
                deletedAt: null,
                studyProgram: prodi,
                gender,
              },
            },
            { $group: { _id: '$pkkmbGroup', n: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      this.userModel.aggregate([
        { $match: { pkkmbGroup: { $in: groupIds }, deletedAt: null } },
        {
          $group: {
            _id: { g: '$pkkmbGroup', gender: { $ifNull: ['$gender', 'L'] } },
            n: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Skor: prodiN > genderGapN (rata cowo/cewe SETIAP gugus) >
    // sameGenderProdiN > totalN (lihat gugus-assignment.ts).
    const countsByGugus = buildCountsByGugus({
      totalAgg: totalAgg as CountAggRow[],
      prodiAgg: prodiAgg as CountAggRow[],
      genderProdiAgg: genderProdiAgg as CountAggRow[],
      genderAgg: genderAgg as GenderCountAggRow[],
      gender,
    });
    const candidates = activeGugus.map((g) => ({
      id: g._id.toString(),
      nomor: g.nomor,
      _id: g._id,
    }));

    const best = pickBestGugus(candidates, countsByGugus);
    if (!best) return false;

    user.pkkmbGroup = best._id;
    user.assignmentStatus = 'ASSIGNED';
    user.assignmentAssignedAt = new Date();
    await user.save();
    return true;
  }

  // ── ADMIN / TIM KESEHATAN ─────────────────────────────────

  async listAll(permissions: string[]) {
    const isAllowed =
      permissions.includes('pkkmb.health.read_all') ||
      permissions.includes('manage:all');
    if (!isAllowed) {
      throw new ForbiddenException('Tidak memiliki akses ke data kesehatan.');
    }
    return this.profileModel
      .find()
      .populate('studentId', 'name nim studyProgram pkkmbGroup')
      .lean()
      .exec();
  }
}
