import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentNumberingFormatDocument } from '../../../schemas/document-numbering-format.schema';
import { DocumentSequenceDocument } from '../../../schemas/document-sequence.schema';
import { TokenRegistryService } from '../numbering-engine/token-registry.service';
import { NumberingEngineService } from '../numbering-engine/numbering-engine.service';
import { DocumentContext } from '../interfaces/document-context.interface';

@Injectable()
export class NumberingManagementService {
  constructor(
    @InjectModel('DocumentNumberingFormat') private readonly formatModel: Model<DocumentNumberingFormatDocument>,
    @InjectModel('DocumentSequence') private readonly sequenceModel: Model<DocumentSequenceDocument>,
    private readonly tokenRegistry: TokenRegistryService,
    private readonly numberingEngine: NumberingEngineService
  ) {}

  async listFormats() {
    return this.formatModel.find({ isActive: true }).sort({ documentType: 1 });
  }

  async getFormat(id: string) {
    const format = await this.formatModel.findById(id);
    if (!format) throw new NotFoundException('Format not found');
    return format;
  }

  async getTokens() {
    return this.tokenRegistry.list();
  }

  async createFormat(data: any) {
    const missing = this.tokenRegistry.validate(data.formatPattern);
    if (missing.length > 0) {
      throw new BadRequestException(`Unregistered tokens found: ${missing.join(', ')}`);
    }

    return this.formatModel.create({ ...data, version: 1 });
  }

  async updateFormat(id: string, data: any) {
    const current = await this.getFormat(id);
    
    if (data.formatPattern) {
      const missing = this.tokenRegistry.validate(data.formatPattern);
      if (missing.length > 0) {
        throw new BadRequestException(`Unregistered tokens found: ${missing.join(', ')}`);
      }
    }

    // Versioning logic: mark current as inactive, create a new one with version + 1
    current.isActive = false;
    await current.save();

    return this.formatModel.create({
      documentType: current.documentType,
      formatPattern: data.formatPattern || current.formatPattern,
      sequenceLength: data.sequenceLength || current.sequenceLength,
      resetPeriod: data.resetPeriod || current.resetPeriod,
      version: current.version + 1,
      isActive: true,
    });
  }

  async getSequenceDetails(documentType: string, context: DocumentContext) {
    const format = await this.formatModel.findOne({ documentType, isActive: true });
    if (!format) throw new NotFoundException('Format not found');
    
    const scopeKey = this.numberingEngine.generateScopeKey(format.resetPeriod, context);
    const seq = await this.sequenceModel.findOne({ documentType, scopeKey });
    
    return {
      currentSequence: seq ? seq.lastSequence : 0,
      scopeKey,
      resetPeriod: format.resetPeriod
    };
  }

  async resetSequence(id: string, context: DocumentContext, reason: string, userId: Types.ObjectId) {
    const format = await this.getFormat(id);
    const scopeKey = this.numberingEngine.generateScopeKey(format.resetPeriod, context);

    // In a real implementation, we would write the reason to an AuditLog collection here
    console.log(`[AUDIT] Sequence manually reset for ${format.documentType} (Scope: ${scopeKey}) by ${userId}. Reason: ${reason}`);

    return this.sequenceModel.findOneAndUpdate(
      { documentType: format.documentType, scopeKey },
      { $set: { lastSequence: 0 } },
      { new: true, upsert: true }
    );
  }

  async preview(formatPattern: string, resetPeriod: string, sequenceLength: number, context: DocumentContext) {
    const missing = this.tokenRegistry.validate(formatPattern);
    if (missing.length > 0) {
      throw new BadRequestException(`Unregistered tokens found: ${missing.join(', ')}`);
    }

    // Mock sequence based on scope
    const scopeKey = this.numberingEngine.generateScopeKey(resetPeriod, context);
    // Find current sequence, default to 0
    let currentSeq = 0;
    if (context.documentType) {
      const seqRecord = await this.sequenceModel.findOne({ documentType: context.documentType, scopeKey });
      if (seqRecord) {
        currentSeq = seqRecord.lastSequence;
      }
    }

    // Ensure context has some defaults for preview
    const extContext = {
      ...context,
      metadata: {
        documentCode: 'DOC',
        departmentCode: 'DEPT',
        cabinetCode: 'CABINET',
        cabinetPeriodName: '2026-2027',
        ...context.metadata
      }
    };

    const { result: current, resolvedTokens } = this.tokenRegistry.resolve(formatPattern, currentSeq > 0 ? currentSeq : 1, sequenceLength, extContext);
    const { result: next } = this.tokenRegistry.resolve(formatPattern, currentSeq + 1, sequenceLength, extContext);
    
    // Simulate Next Reset (usually next year/period)
    const nextDate = new Date();
    if (resetPeriod === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (resetPeriod === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    
    const resetContext = { ...extContext, simulatedDate: nextDate.toISOString() };
    const { result: nextReset } = this.tokenRegistry.resolve(formatPattern, 1, sequenceLength, resetContext);

    return {
      current,
      next,
      nextReset,
      resolvedTokens
    };
  }
}
