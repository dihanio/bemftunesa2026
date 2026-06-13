import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BEMDocument } from '../../database/schema/documents';
import { DocumentVersion } from '../../database/schema/security';
import { Notification } from '../../database/schema/core';
import { User } from '../../database/schema/users';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';
import { randomUUID } from 'crypto';
import { UploadService } from '../../upload/upload.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(BEMDocument.name) private docModel: Model<BEMDocument>,
    @InjectModel(DocumentVersion.name)
    private versionModel: Model<DocumentVersion>,
    @InjectModel(Notification.name) private notifModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
    private uploadService: UploadService,
  ) {}

  async list(query: any) {
    const options = parsePaginationQuery(query);
    return paginate(this.docModel, {}, options, ['title', 'documentNumber']);
  }

  async create(data: any) {
    const doc = await this.docModel.create({
      ...data,
      qrUuid: randomUUID(),
      status: 'Menunggu Asistensi',
      draftFileUrl: data.fileUrl,
    });
    return { data: doc, message: 'Draft surat berhasil dibuat dan Menunggu Asistensi' };
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
      { $set: { status: 'Selesai', signedAt: new Date() } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    return { data: doc, message: 'Dokumen berhasil di-approve' };
  }

  async assistDocument(id: string, documentNumber: string, userId: string) {
    const doc = await this.docModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'Revisi Nomor Surat', documentNumber } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    
    // Notify the creator
    await this.notifModel.create({
      recipientId: doc.creatorId,
      title: 'Nomor Surat Turun',
      message: `Surat ${doc.title} telah diberi nomor ${documentNumber}. Silakan upload final PDF.`,
      category: 'ims',
      actionData: { link: `/surat/${id}` }
    });

    return { data: doc, message: 'Nomor surat berhasil diberikan, status menjadi Revisi Nomor Surat' };
  }

  async uploadFinal(id: string, finalFileUrl: string, userId: string) {
    const doc = await this.docModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'Menunggu ACC Sekretaris', finalFileUrl } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    return { data: doc, message: 'File final diunggah, menunggu ACC Sekretaris' };
  }

  async accSekretaris(id: string, userId: string) {
    const doc = await this.docModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'Menunggu TTD Ketua' } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');

    // Notify Ketua BEM
    const ketuaBEM = await this.userModel.findOne({ role: 'Ketua BEM', isActive: true });
    if (ketuaBEM) {
      await this.notifModel.create({
        recipientId: ketuaBEM._id,
        title: 'Menunggu TTD Surat',
        message: `Surat ${doc.title} telah di-ACC Sekretaris. Menunggu Tanda Tangan Anda.`,
        category: 'ims',
        actionData: { link: `/surat/${id}` }
      });
    }

    return { data: doc, message: 'ACC Sekretaris berhasil, notifikasi terkirim ke Ketua BEM' };
  }

  async signDocument(id: string, payload: { signatureX: number; signatureY: number; signatureImage?: string; stampImage?: string }, userId: string) {
    const doc = await this.docModel.findOne({ _id: id, deletedAt: null });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');

    try {
      const { PDFDocument, rgb } = require('pdf-lib');
      
      if (!doc.finalFileUrl) throw new BadRequestException('URL File Final tidak ditemukan');

      // Fetch the final PDF buffer
      const response = await fetch(doc.finalFileUrl);
      if (!response.ok) throw new Error(`Gagal mengunduh PDF: ${response.statusText}`);
      const pdfBytes = await response.arrayBuffer();

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      // Draw digital signature mark
      lastPage.drawText('DISETUJUI SECARA DIGITAL OLEH', {
        x: payload.signatureX || 100,
        y: (payload.signatureY || 100) + 20,
        size: 10,
        color: rgb(0, 0.5, 0),
      });
      lastPage.drawText('KETUA BEM FT UNESA', {
        x: payload.signatureX || 100,
        y: payload.signatureY || 100,
        size: 10,
        color: rgb(0, 0.5, 0),
      });

      const signedBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(signedBytes).toString('base64');
      const dataUri = `data:application/pdf;base64,${base64Pdf}`;

      // Upload to Supabase using UploadService
      const uploadRes = await this.uploadService.uploadDocument({
        file: dataUri,
        fileName: `signed-${doc._id}.pdf`,
      });

      const signedFileUrl = uploadRes.data.url;

      doc.status = 'Selesai';
      doc.signedAt = new Date();
      doc.signedById = new Types.ObjectId(userId);
      doc.signedFileUrl = signedFileUrl;
      doc.fileUrl = signedFileUrl;
      await doc.save();

      // Notify the creator
      await this.notifModel.create({
        recipientId: doc.creatorId,
        title: 'Surat Selesai (TTD)',
        message: `Surat ${doc.title} telah ditandatangani oleh Ketua BEM dan Selesai.`,
        category: 'ims',
        actionData: { link: `/surat/${id}` }
      });

      return { data: doc, message: 'Dokumen berhasil ditandatangani dan Selesai' };
    } catch (err) {
      throw new Error(`Gagal memproses PDF: ${err}`);
    }
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
