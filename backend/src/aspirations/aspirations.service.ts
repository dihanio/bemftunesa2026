import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Aspiration, AspirationDocument } from '../schemas/aspiration.schema';
import { CreateAspirationDto, UpdateAspirationDto, QueryAspirationDto } from './dto/aspiration.dto';

@Injectable()
export class AspirationsService {
  constructor(
    @InjectModel(Aspiration.name) private aspirationModel: Model<AspirationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryAspirationDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.urgency) filter.urgency = query.urgency;
    if (query.cabinetPeriod) filter.cabinetPeriod = query.cabinetPeriod;

    const data = await this.aspirationModel
      .find(filter)
      .populate('submitter', 'name email')
      .populate('assignedDepartment', 'name')
      .sort({ dateSubmitted: -1 })
      .exec();
    
    return { data };
  }

  async findById(id: string) {
    const aspiration = await this.aspirationModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('submitter', 'name email')
      .populate('assignedDepartment', 'name')
      .exec();
    if (!aspiration) throw new NotFoundException('Aspiration not found');
    return aspiration;
  }

  async create(dto: CreateAspirationDto, userId?: string) {
    // SLA metrics calculation
    const now = new Date();
    const targetResponseDate = new Date(now);
    if (dto.urgency === 'urgent') targetResponseDate.setDate(targetResponseDate.getDate() + 1);
    else if (dto.urgency === 'high') targetResponseDate.setDate(targetResponseDate.getDate() + 3);
    else targetResponseDate.setDate(targetResponseDate.getDate() + 7); // Default 7 days

    const aspiration = await this.aspirationModel.create({
      ...dto,
      cabinetPeriod: dto.cabinetPeriod || '2026',
      submitter: userId && !dto.isAnonymous ? new Types.ObjectId(userId) : undefined,
      dateSubmitted: now,
      targetResponseDate,
    });

    return aspiration;
  }

  async update(id: string, dto: UpdateAspirationDto) {
    const aspiration = await this.findById(id);

    // SLA tracking
    if (dto.status === 'processing' && aspiration.status === 'new') {
      aspiration.firstResponseDate = new Date();
    }
    if (dto.status && ['resolved', 'rejected'].includes(dto.status) && !aspiration.resolutionDate) {
      aspiration.resolutionDate = new Date();
    }

    if (dto.assignedDepartment) {
      aspiration.assignedDepartment = new Types.ObjectId(dto.assignedDepartment) as never;
    }
    if (dto.status) aspiration.status = dto.status;
    
    let isNewResponse = false;
    if (dto.officialResponse && dto.officialResponse !== aspiration.officialResponse) {
      aspiration.officialResponse = dto.officialResponse;
      isNewResponse = true;
    }

    const saved = await aspiration.save();

    if (isNewResponse && !saved.isAnonymous && saved.submitter) {
      // Need to make sure submitter is populated or we at least have email
      // Let's re-fetch to ensure submitter email is present
      const populated = await this.aspirationModel.findById(saved._id).populate('submitter', 'name email').exec();
      if (populated && populated.submitter && (populated.submitter as { email?: string; name?: string }).email) {
        this.eventEmitter.emit('aspiration.responded', {
          email: (populated.submitter as { email?: string; name?: string }).email,
          name: (populated.submitter as { email?: string; name?: string }).name,
          subject: populated.title,
          response: populated.officialResponse,
        });
      }
    }

    return saved;
  }

  async delete(id: string) {
    const aspiration = await this.findById(id);
    aspiration.deletedAt = new Date();
    await aspiration.save();
    return { deleted: true };
  }

  // --- DSS SAW Implementation ---
  async calculateSawPriority(cabinetPeriod?: string) {
    const filter: Record<string, unknown> = {
      deletedAt: { $exists: false },
      status: { $in: ['new', 'processing', 'pending'] }
    };
    if (cabinetPeriod) filter.cabinetPeriod = cabinetPeriod;

    const aspirations = await this.aspirationModel
      .find(filter)
      .populate('assignedDepartment', 'name')
      .exec();

    if (aspirations.length === 0) return { data: [], matrix: [], normalized: [] };

    // 1. Definisikan Bobot Kriteria (W)
    // C1: Urgensi (Benefit) 35%
    // C2: Waktu Tunggu (Benefit) 25%
    // C3: Upvotes (Benefit) 20%
    // C4: Kompleksitas (Cost) 20%
    const weights = { c1: 0.35, c2: 0.25, c3: 0.20, c4: 0.20 };

    // 2. Buat Matriks Keputusan (X)
    const now = new Date().getTime();
    const matrix = aspirations.map(asp => {
      // C1 Mapping
      let c1 = 1;
      if (asp.urgency === 'medium') c1 = 2;
      else if (asp.urgency === 'high') c1 = 3;
      else if (asp.urgency === 'urgent') c1 = 4;

      // C2 Waktu Tunggu (Hari)
      const submittedTime = asp.dateSubmitted ? new Date(asp.dateSubmitted).getTime() : now;
      let c2 = Math.floor((now - submittedTime) / (1000 * 60 * 60 * 24));
      if (c2 < 0) c2 = 0;
      if (c2 === 0) c2 = 1; // Minimal 1 hari agar tidak 0

      // C3 Upvotes
      let c3 = asp.upvotes || 0;
      if (c3 === 0) c3 = 1; // Minimal 1

      // C4 Kompleksitas
      const c4 = asp.complexity || 3;

      return {
        id: asp._id,
        aspiration: asp,
        c1, c2, c3, c4
      };
    });

    // Cari nilai max dan min untuk normalisasi
    const maxC1 = Math.max(...matrix.map(x => x.c1));
    const maxC2 = Math.max(...matrix.map(x => x.c2));
    const maxC3 = Math.max(...matrix.map(x => x.c3));
    const minC4 = Math.min(...matrix.map(x => x.c4));

    // 3. Normalisasi Matriks (R)
    const normalized = matrix.map(x => ({
      id: x.id,
      r1: x.c1 / maxC1,
      r2: x.c2 / maxC2,
      r3: x.c3 / maxC3,
      r4: minC4 / x.c4, // Cost criteria: min / value
    }));

    // 4. Hitung Nilai Akhir / Preferensi (V)
    const finalScores = normalized.map(r => {
      const v = (r.r1 * weights.c1) + (r.r2 * weights.c2) + (r.r3 * weights.c3) + (r.r4 * weights.c4);
      const original = matrix.find(m => m.id === r.id);
      return {
        aspiration: original?.aspiration,
        matrix: { c1: original?.c1, c2: original?.c2, c3: original?.c3, c4: original?.c4 },
        normalized: { r1: r.r1, r2: r.r2, r3: r.r3, r4: r.r4 },
        score: Math.round(v * 1000) / 1000
      };
    });

    // 5. Urutkan berdasarkan V tertinggi (Rank 1)
    finalScores.sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: finalScores,
      weights
    };
  }
}
