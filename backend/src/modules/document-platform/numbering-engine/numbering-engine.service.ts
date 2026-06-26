import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentNumberingFormatDocument } from '../../../schemas/document-numbering-format.schema';
import { DocumentSequenceDocument } from '../../../schemas/document-sequence.schema';
import { DocumentSequenceHistoryDocument, SequenceStatus } from '../../../schemas/document-sequence-history.schema';
import { DocumentContext } from '../interfaces/document-context.interface';
import { TokenRegistryService } from './token-registry.service';

@Injectable()
export class NumberingEngineService {
  constructor(
    @InjectModel('DocumentNumberingFormat') private readonly formatModel: Model<DocumentNumberingFormatDocument>,
    @InjectModel('DocumentSequence') private readonly sequenceModel: Model<DocumentSequenceDocument>,
    @InjectModel('DocumentSequenceHistory') private readonly historyModel: Model<DocumentSequenceHistoryDocument>,
    private readonly tokenRegistry: TokenRegistryService
  ) {}

  /**
   * Generates a scope key based on the reset period and context.
   */
  generateScopeKey(resetPeriod: string, context: DocumentContext, date?: Date): string {
    const cabinetPeriodId = context.cabinetPeriod ? String(context.cabinetPeriod) : 'GLOBAL';
    const now = date || (context.simulatedDate ? new Date(context.simulatedDate) : new Date());
    
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const semester = Math.ceil(month / 6);

    switch (resetPeriod) {
      case 'yearly':
        return `YEAR:${year}|CABINET:${cabinetPeriodId}`;
      case 'semester':
        return `YEAR:${year}|SEMESTER:${semester}|CABINET:${cabinetPeriodId}`;
      case 'quarterly':
        return `YEAR:${year}|QUARTER:${quarter}|CABINET:${cabinetPeriodId}`;
      case 'monthly':
        return `YEAR:${year}|MONTH:${month}|CABINET:${cabinetPeriodId}`;
      case 'cabinet_period':
        return `CABINET:${cabinetPeriodId}`;
      case 'never':
      default:
        return 'GLOBAL';
    }
  }

  /**
   * Reserves a new document number but does not permanently commit it.
   */
  async reserveNumber(documentType: string, context: DocumentContext, userId?: Types.ObjectId): Promise<{ sequence: number, formattedNumber: string, historyId: Types.ObjectId }> {
    const formatConfig = await this.formatModel.findOne({ documentType, isActive: true });
    
    if (!formatConfig) {
      throw new NotFoundException(`No active numbering format found for document type: ${documentType}`);
    }

    const scopeKey = this.generateScopeKey(formatConfig.resetPeriod, context);

    // Atomic increment
    const sequenceRecord = await this.sequenceModel.findOneAndUpdate(
      { documentType, scopeKey },
      { $inc: { lastSequence: 1 } },
      { new: true, upsert: true }
    );

    const seqNumber = sequenceRecord.lastSequence;
    
    const { result: formattedNumber } = this.tokenRegistry.resolve(
      formatConfig.formatPattern, 
      seqNumber, 
      formatConfig.sequenceLength, 
      context
    );

    // Track in history as reserved
    const history = await this.historyModel.create({
      documentType,
      scopeKey,
      sequence: seqNumber,
      generatedNumber: formattedNumber,
      status: SequenceStatus.RESERVED,
      generatedBy: userId
    });

    return { 
      sequence: seqNumber, 
      formattedNumber, 
      historyId: history._id as Types.ObjectId 
    };
  }

  /**
   * Commits a reserved number to a document.
   */
  async commitNumber(historyId: Types.ObjectId, documentId: Types.ObjectId) {
    await this.historyModel.findByIdAndUpdate(historyId, {
      status: SequenceStatus.COMMITTED,
      documentId
    });
  }

  /**
   * Voids a reserved number if the document generation failed or was cancelled.
   */
  async voidNumber(historyId: Types.ObjectId) {
    await this.historyModel.findByIdAndUpdate(historyId, {
      status: SequenceStatus.VOID
    });
  }

  /**
   * Legacy method for backward compatibility, automatically commits.
   */
  async generateNumber(documentType: string, context: DocumentContext, documentId?: Types.ObjectId, userId?: Types.ObjectId): Promise<string> {
    const { formattedNumber, historyId } = await this.reserveNumber(documentType, context, userId);
    
    if (documentId) {
      await this.commitNumber(historyId, documentId);
    }
    
    return formattedNumber;
  }
}
