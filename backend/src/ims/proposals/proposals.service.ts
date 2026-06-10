import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';
import { Proposal } from '../../database/schema/finance';
import { RAB } from '../../database/schema/finance';
import { Proker } from '../../database/schema/proker';
import { User } from '../../database/schema/users';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectModel(Proposal.name) private proposalModel: Model<Proposal>,
    @InjectModel(RAB.name) private rabModel: Model<RAB>,
    @InjectModel(Proker.name) private prokerModel: Model<Proker>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(query: any, userDeptId?: string, isBPI: boolean = true) {
    const options = parsePaginationQuery(query);
    const filter: any = { deletedAt: null };

    if (!isBPI && userDeptId) {
      const deptObjectId =
        typeof userDeptId === 'string'
          ? new Types.ObjectId(userDeptId)
          : userDeptId;
      const prokers = await this.prokerModel
        .find({ departmentId: deptObjectId, deletedAt: null })
        .select('_id')
        .lean()
        .exec();
      const prokerIds = prokers.map((p) => p._id);
      filter.prokerId = { $in: prokerIds };
    }

    return paginate(this.proposalModel, filter, options, ['title']);
  }

  async create(data: any) {
    const { rabItems, ...proposalData } = data;
    const proposal = await this.proposalModel.create(proposalData);
    if (rabItems && Array.isArray(rabItems)) {
      const items = rabItems.map((item: any) => ({
        ...item,
        proposalId: proposal._id,
        prokerId: proposalData.prokerId,
      }));
      await this.rabModel.insertMany(items);
    }

    // Notify all Bendahara BEM BPI that a new proposal has been submitted
    try {
      const proker = await this.prokerModel.findById(proposalData.prokerId);
      const prokerName = proker ? proker.title : 'Program Kerja BEM';
      await this.notificationsService.notifyRole('Bendahara', {
        title: `Proposal Baru Masuk: ${proposal.title}`,
        message: `Ketua Pelaksana mengajukan proposal baru "${proposal.title}" untuk proker "${prokerName}" yang memerlukan review keuangan Anda.`,
        category: 'ims',
        actionData: { link: `/finance/proposal/${proposal._id}` },
      });
    } catch (err) {
      console.error(
        '[ProposalsService] Failed to notify proposal creation:',
        err,
      );
    }

    return { data: proposal, message: 'Proposal berhasil dibuat' };
  }

  async validateAdmin(
    id: string,
    body?: { note?: string; authorName?: string },
  ) {
    const update: any = { $set: { status: 'Validated Admin' } };
    if (body?.note && body?.authorName) {
      update.$push = {
        notes: {
          authorName: body.authorName,
          note: body.note,
          createdAt: new Date(),
        },
      };
    }
    const proposal = await this.proposalModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      update,
      { new: true },
    );
    if (!proposal) throw new NotFoundException('Proposal tidak ditemukan');

    // Notify PJ & Department BPH
    const noteSnippet = body?.note ? ` Catatan: "${body.note}"` : '';
    await this.notifyProposalUpdate(
      proposal,
      `VALIDASI ADMIN - Berkas administratif proposal telah disetujui.${noteSnippet}`,
    );

    return {
      data: proposal,
      message: 'Proposal berhasil divalidasi secara administratif',
    };
  }

  async validateFinance(
    id: string,
    body?: { note?: string; authorName?: string },
  ) {
    const update: any = { $set: { status: 'Validated Finance' } };
    if (body?.note && body?.authorName) {
      update.$push = {
        notes: {
          authorName: body.authorName,
          note: body.note,
          createdAt: new Date(),
        },
      };
    }
    const proposal = await this.proposalModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      update,
      { new: true },
    );
    if (!proposal) throw new NotFoundException('Proposal tidak ditemukan');

    // Notify PJ & Department BPH
    const noteSnippet = body?.note ? ` Catatan: "${body.note}"` : '';
    await this.notifyProposalUpdate(
      proposal,
      `VALIDASI KEUANGAN - Rincian RAB anggaran belanja telah divalidasi.${noteSnippet}`,
    );

    return {
      data: proposal,
      message: 'RAB & Keuangan proposal berhasil divalidasi',
    };
  }

  async requestRevision(
    id: string,
    body: { note: string; authorName: string },
  ) {
    const proposal = await this.proposalModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: { status: 'Revision' },
        $push: {
          notes: {
            authorName: body.authorName,
            note: body.note,
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!proposal) throw new NotFoundException('Proposal tidak ditemukan');

    // Notify PJ & Department BPH
    await this.notifyProposalUpdate(
      proposal,
      `REVISI - Proposal dikembalikan oleh BPI untuk diperbaiki. Catatan: "${body.note}"`,
    );

    return {
      data: proposal,
      message: 'Proposal dikembalikan untuk revisi panitia',
    };
  }

  async approve(id: string, body?: { note?: string; authorName?: string }) {
    const update: any = { $set: { status: 'Approved' } };
    if (body?.note && body?.authorName) {
      update.$push = {
        notes: {
          authorName: body.authorName,
          note: body.note,
          createdAt: new Date(),
        },
      };
    }
    const proposal = await this.proposalModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      update,
      { new: true },
    );
    if (!proposal) throw new NotFoundException('Proposal tidak ditemukan');
    await this.rabModel.updateMany(
      { proposalId: id },
      { $set: { status: 'Approved' } },
    );

    // Notify PJ & Department BPH
    const noteSnippet = body?.note ? ` Catatan: "${body.note}"` : '';
    await this.notifyProposalUpdate(
      proposal,
      `DISETUJUI (APPROVED) - Proposal disetujui secara final. Anggaran siap dicairkan.${noteSnippet}`,
    );

    return {
      data: proposal,
      message: 'Proposal & RAB berhasil disetujui (Approved)',
    };
  }

  private async notifyProposalUpdate(
    proposal: HydratedDocument<Proposal>,
    statusMessage: string,
  ) {
    try {
      const proker = await this.prokerModel.findById(proposal.prokerId);
      if (proker) {
        // 1. Notify Penanggung Jawab (PJ) of the proker
        if (proker.pjId) {
          await this.notificationsService.createNotification({
            recipientId: proker.pjId.toString(),
            title: `Update Status Proposal: ${proposal.title}`,
            message: `Proposal Anda "${proposal.title}" untuk proker "${proker.title}" telah diperbarui ke status: [${statusMessage}].`,
            category: 'ims',
            actionData: { link: `/finance/proposal/${proposal._id}` },
          });
        }

        // 2. Notify BPH (Kadep/Wakadep) of the organizing department
        const departmentUsers = await this.userModel.find({
          departmentId: proker.departmentId,
          role: { $in: ['Kadep', 'Wakadep'] },
          isActive: true,
          deletedAt: null,
        });

        for (const user of departmentUsers) {
          await this.notificationsService.createNotification({
            recipientId: user._id.toString(),
            title: `Update Proposal Departemen: ${proposal.title}`,
            message: `Proposal "${proposal.title}" di bawah departemen Anda telah diperbarui ke status: [${statusMessage}].`,
            category: 'ims',
            actionData: { link: `/finance/proposal/${proposal._id}` },
          });
        }
      }
    } catch (err) {
      console.error(
        '[ProposalsService] Failed to notify proposal update:',
        err,
      );
    }
  }

  async getRabItems(proposalId: string) {
    const items = await this.rabModel.find({ proposalId }).lean();
    return { data: items };
  }

  async updateRabItemStatus(
    itemId: string,
    status: 'Approved' | 'Rejected',
    userId: string,
  ) {
    const { Types } = require('mongoose');
    const item = await this.rabModel.findOneAndUpdate(
      { _id: itemId, deletedAt: null },
      { $set: { status, approvedBy: new Types.ObjectId(userId) } },
      { new: true },
    );
    if (!item) throw new NotFoundException('RAB item tidak ditemukan');
    return {
      data: item,
      message: `Status RAB item berhasil diupdate menjadi ${status}`,
    };
  }
}
