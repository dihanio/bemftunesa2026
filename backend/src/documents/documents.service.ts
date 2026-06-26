import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.schema'; import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
  ) {}

  async findAll(query: QueryDocumentDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.department) filter.department = new Types.ObjectId(query.department);
    if (query.cabinetPeriod) filter.cabinetPeriod = new Types.ObjectId(query.cabinetPeriod);
    if (query.program) filter.program = new Types.ObjectId(query.program);
    if (query.type) filter.type = query.type;
    if (query.accessLevel) filter.accessLevel = query.accessLevel;

    const data = await this.documentModel
      .find(filter)
      .populate('department', 'name')
      .populate('uploader', 'name avatar')
      .sort({ createdAt: -1 })
      .exec();
    
    return { data };
  }

  async findById(id: string) {
    const document = await this.documentModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('department', 'name')
      .populate('uploader', 'name email avatar')
      .populate('program', 'title')
      .exec();
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async create(dto: CreateDocumentDto, uploaderId: string) {
    const document = await this.documentModel.create({
      ...dto,
      cabinetPeriod: new Types.ObjectId(dto.cabinetPeriod),
      department: new Types.ObjectId(dto.department),
      program: dto.program ? new Types.ObjectId(dto.program) : undefined,
      uploader: new Types.ObjectId(uploaderId),
      version: 1,
    });
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const document = await this.findById(id);

    // If URL changes, we bump the version
    if (dto.url && dto.url !== document.url) {
      document.version += 1;
    }

    Object.assign(document, dto);

    return document.save();
  }

  async delete(id: string) {
    const document = await this.findById(id);
    document.deletedAt = new Date();
    await document.save();
    return { deleted: true };
  }
}
