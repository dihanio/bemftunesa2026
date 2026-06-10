import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BEMDocument } from '../../database/schema/documents';
import { DocumentVersion } from '../../database/schema/security';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(BEMDocument.name) private docModel: Model<BEMDocument>,
    @InjectModel(DocumentVersion.name)
    private versionModel: Model<DocumentVersion>,
  ) {}

  async list(query: any) {
    const options = parsePaginationQuery(query);
    return paginate(this.docModel, {}, options, ['title', 'documentNumber']);
  }

  async create(data: any) {
    const doc = await this.docModel.create({ ...data, qrUuid: randomUUID() });
    return { data: doc, message: 'Draft surat berhasil dibuat' };
  }

  async update(id: string, data: any) {
    const doc = await this.docModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    return { data: doc, message: 'Dokumen berhasil diupdate' };
  }

  async approve(id: string) {
    const doc = await this.docModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'Approved', signedAt: new Date() } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    return { data: doc, message: 'Dokumen berhasil di-approve' };
  }

  async generatePdf(id: string) {
    const doc = await this.docModel.findOne({ _id: id, deletedAt: null });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');

    const pdfData = {
      documentId: id,
      title: doc.title,
      type: doc.type,
      documentNumber: doc.documentNumber,
      qrUuid: doc.qrUuid,
      status: doc.status,
      signedAt: doc.signedAt,
      createdAt: (doc as any).createdAt,
      verifyUrl: `https://bemftunesa.org/verify/${doc.qrUuid}`,
    };

    return {
      data: pdfData,
      message: 'Data dokumen untuk PDF generation',
    };
  }

  async listHistory(documentId: string) {
    const history = await this.versionModel
      .find({ entityId: documentId })
      .sort({ version: -1 })
      .populate('createdBy', 'name')
      .lean();
    return { data: history };
  }

  async createSnapshot(
    documentId: string,
    input: { note?: string; snapshot: any; userId: string },
  ) {
    const lastVersion = await this.versionModel
      .findOne({ entityId: documentId })
      .sort({ version: -1 })
      .lean();
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    const versionDoc = await this.versionModel.create({
      entityType: 'BEMDocument',
      entityId: documentId,
      version: nextVersion,
      snapshot: input.snapshot,
      note: input.note,
      createdBy: new Types.ObjectId(input.userId),
    });

    return {
      data: versionDoc,
      message: `Versi v${nextVersion} berhasil disimpan`,
    };
  }

  async rollback(documentId: string, versionNumber: number, userId: string) {
    const targetVersion = await this.versionModel.findOne({
      entityId: documentId,
      version: versionNumber,
    });
    if (!targetVersion) {
      throw new NotFoundException(`Versi v${versionNumber} tidak ditemukan`);
    }

    const snapshot = targetVersion.snapshot;
    const doc = await this.docModel.findOneAndUpdate(
      { _id: documentId, deletedAt: null },
      {
        $set: {
          title: snapshot.title,
          fileUrl: snapshot.fileUrl,
          metadata: snapshot.metadata,
        },
      },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');

    await this.createSnapshot(documentId, {
      note: `Rollback ke versi v${versionNumber}`,
      snapshot: {
        title: doc.title,
        fileUrl: doc.fileUrl,
        metadata: doc.metadata,
      },
      userId,
    });

    return {
      data: doc,
      message: `Berhasil rollback ke versi v${versionNumber}`,
    };
  }
}
