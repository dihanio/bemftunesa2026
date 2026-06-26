import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException, ConflictException, InternalServerErrorException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Surat, SuratDocument } from '../../schemas/surat.schema';
import { DocumentTemplate, DocumentTemplateDocument } from '../../schemas/document-template.schema';
import { WorkflowInstance, WorkflowInstanceDocument, DocumentState, WorkflowAction } from '../../schemas/workflow-instance.schema';
import { WorkflowDefinition, WorkflowDefinitionDocument } from '../../schemas/workflow-definition.schema';
import { TemplateEngineService } from '../document-platform/template-engine/template-engine.service';
import { WorkflowEngineService } from '../document-platform/workflow-engine/workflow-engine.service';
import { NumberingEngineService } from '../document-platform/numbering-engine/numbering-engine.service';
import { AiEngineService } from '../document-platform/ai-engine/ai-engine.service';
import { ExportEngineService } from '../document-platform/export-engine/export-engine.service';
import {
  CreateSuratDraftDto, UploadDocumentVersionDto, SuratQueryDto, AiGenerateDto, AiReviseDto, WorkflowActionDto
} from './dto/surat-api.dto';
import { DocumentVersion, DocumentVersionDocument } from '../../schemas/document-version.schema';

@Injectable()
export class SuratService {
  constructor(
    @InjectModel(Surat.name) private suratModel: Model<SuratDocument>,
    @InjectModel(DocumentTemplate.name) private templateModel: Model<DocumentTemplateDocument>,
    @InjectModel(WorkflowInstance.name) private workflowInstanceModel: Model<WorkflowInstanceDocument>,
    @InjectModel(WorkflowDefinition.name) private workflowDefinitionModel: Model<WorkflowDefinitionDocument>,
    @InjectModel(DocumentVersion.name) private documentVersionModel: Model<DocumentVersionDocument>,
    
    private readonly templateEngine: TemplateEngineService,
    private readonly workflowEngine: WorkflowEngineService,
    private readonly numberingEngine: NumberingEngineService,
    private readonly aiEngine: AiEngineService,
    private readonly exportEngine: ExportEngineService,
  ) {}

  // ==========================================
  // DRAFT & CRUD
  // ==========================================

  async createDraft(dto: CreateSuratDraftDto, userId: string): Promise<SuratDocument> {
    let template = null;
    if (dto.templateId && dto.templateId !== 'blank') {
      template = await this.templateModel.findById(dto.templateId);
      if (!template || template.status !== 'published') {
        throw new NotFoundException('Template not found or inactive');
      }
    }

    // Create workflow instance
    let workflowDef = null;
    if (dto.workflowDefinitionId) {
      workflowDef = await this.workflowDefinitionModel.findById(dto.workflowDefinitionId);
    } else {
      // Fallback to the first published workflow definition if not provided
      workflowDef = await this.workflowDefinitionModel.findOne({ status: 'published' });
    }
    
    if (!workflowDef || workflowDef.status !== 'published') {
      throw new InternalServerErrorException('Invalid or inactive workflow definition');
    }

    let initialStageId = 'draft';
    if (workflowDef.stages && workflowDef.stages.length > 0) {
      const sortedStages = [...workflowDef.stages].sort((a, b) => a.order - b.order);
      initialStageId = sortedStages[0].id;
    }

    const workflowInstance = new this.workflowInstanceModel({
      documentId: new Types.ObjectId(), // We'll update this after surat creation
      documentType: 'surat',
      workflowDefinition: workflowDef._id,
      currentStageId: initialStageId,
      currentState: DocumentState.DRAFT, // Legacy fallback
    });

    const surat = new this.suratModel({
      title: dto.title,
      type: dto.type,
      category: dto.category,
      sender: dto.sender,
      recipient: dto.recipient,
      template: template ? template._id : undefined,
      summary: dto.summary || '',
      department: dto.departmentId || undefined,
      cabinetPeriod: dto.cabinetPeriodId || undefined,
      submittedBy: userId,
      workflowInstance: workflowInstance._id,
    });

    if (dto.fileUrl) {
      const documentVersion = new this.documentVersionModel({
        documentId: surat._id,
        documentModel: 'Surat',
        versionNumber: 1,
        versionType: 'draft',
        fileUrl: dto.fileUrl,
        fileHash: dto.fileHash,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        uploadedBy: userId,
        isCurrent: true,
        relatedWorkflowStage: initialStageId,
      });

      await documentVersion.save();
      
      surat.currentVersion = documentVersion._id as Types.ObjectId;
      surat.attachments = [dto.fileUrl]; // Storing as initial attachment optionally
    }

    workflowInstance.documentId = surat._id as Types.ObjectId;

    await workflowInstance.save();
    return surat.save();
  }

  async findOne(id: string): Promise<SuratDocument> {
    const surat = await this.suratModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('workflowInstance')
      .populate('template')
      .populate('currentVersion');
    if (!surat) throw new NotFoundException('Surat not found');
    return surat;
  }

  async uploadNewVersion(id: string, dto: UploadDocumentVersionDto, userId: string): Promise<SuratDocument> {
    const surat = await this.findOne(id);
    const workflow = surat.workflowInstance as any;
    
    // Find highest version number
    const lastVersion = await this.documentVersionModel.findOne({ documentId: surat._id }).sort({ versionNumber: -1 });
    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    // Set old versions to not current
    await this.documentVersionModel.updateMany({ documentId: surat._id }, { $set: { isCurrent: false } });

    const newVersion = new this.documentVersionModel({
      documentId: surat._id,
      documentModel: 'Surat',
      versionNumber: nextVersion,
      versionType: dto.versionType,
      fileUrl: dto.fileUrl,
      fileHash: dto.fileHash,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      notes: dto.notes,
      uploadedBy: userId,
      isCurrent: true,
      relatedWorkflowStage: workflow.currentStageId || 'unknown',
    });

    await newVersion.save();

    surat.currentVersion = newVersion._id as Types.ObjectId;
    surat.attachments.push(dto.fileUrl);

    // If version is final external, we might want to auto-approve the workflow or something.
    // For now we just save the document.
    return surat.save();
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const surat = await this.findOne(id);
    const workflow = surat.workflowInstance as any;
    
    const isLegacyDraftOrCancelled = [DocumentState.DRAFT, DocumentState.CANCELLED].includes(workflow.currentState);
    const isNewDraftOrCancelled = ['draft', 'cancelled'].includes(workflow.currentStageId);

    if (!isLegacyDraftOrCancelled && !isNewDraftOrCancelled) {
      throw new BadRequestException('Only DRAFT or CANCELLED documents can be deleted');
    }

    surat.deletedAt = new Date();
    await surat.save();
  }

  // ==========================================
  // TEMPLATE VALIDATION
  // ==========================================

  async validatePlaceholders(id: string): Promise<any> {
    return {
      isValid: true,
      missingPlaceholders: []
    };
  }

  // ==========================================
  // WORKFLOW ACTION
  // ==========================================

  async executeWorkflowAction(id: string, action: WorkflowAction, userContext: any, dto?: WorkflowActionDto) {
    const surat = await this.findOne(id);
    const instance = await this.workflowInstanceModel.findById(surat.workflowInstance);
    if (!instance) throw new NotFoundException('Workflow instance not found');

    const definition = await this.workflowDefinitionModel.findById(instance.workflowDefinition);
    if (!definition) throw new NotFoundException('Workflow definition not found');

    const result = await this.workflowEngine.executeAction(
      action,
      instance,
      definition,
      new Types.ObjectId(userContext.id),
      userContext.roles,
      surat, // Pass documentData
      dto?.comment
    );

    // Save instance state
    await instance.save();
    return result;
  }

  /**
   * Resolves available workflow actions for a surat based on its current stage
   * and the user's roles. Used by the frontend to dynamically render action buttons.
   */
  async getAvailableActions(id: string, userContext: any) {
    const surat = await this.findOne(id);
    const instance = await this.workflowInstanceModel.findById(surat.workflowInstance);
    if (!instance) return { actions: [], currentStageId: 'unknown' };

    const definition = await this.workflowDefinitionModel.findById(instance.workflowDefinition);
    if (!definition) return { actions: [], currentStageId: instance.currentStageId };

    const currentStageId = instance.currentStageId || 'draft';
    const currentStage = definition.stages.find(s => s.id === currentStageId);

    // Find all transitions from the current stage
    const outgoingTransitions = definition.transitions.filter(
      t => t.fromStage === currentStageId
    );

    // Deduplicate by action name (multiple transitions can share the same action)
    const uniqueActions = new Map<string, { action: string; name: string; requiresComment: boolean }>();
    
    for (const t of outgoingTransitions) {
      if (!uniqueActions.has(t.action)) {
        const requiresComment = ['REJECT', 'REQUEST_REVISION', 'RETURN'].includes(t.action.toUpperCase());
        uniqueActions.set(t.action, {
          action: t.action,
          name: t.name,
          requiresComment,
        });
      }
    }

    return {
      currentStageId,
      currentStageName: currentStage?.name || currentStageId,
      currentState: instance.currentState, // Legacy compatibility
      actions: Array.from(uniqueActions.values()),
    };
  }

  // ==========================================
  // NUMBERING & EXPORT
  // ==========================================

  async generateLetterNumber(id: string): Promise<string> {
    const surat = await this.findOne(id);
    const workflow = surat.workflowInstance as any;
    
    const isLegacyDraft = workflow.currentState === DocumentState.DRAFT;
    const isNewDraft = workflow.currentStageId === 'draft';

    // Usually number is generated after approval or during submit
    if (isLegacyDraft || isNewDraft) {
      throw new BadRequestException('Cannot generate number for draft document');
    }

    const numberStr = await this.numberingEngine.generateNumber('surat', {
      documentData: {
        title: surat.title,
        type: surat.type,
        department: surat.department
      },
      documentType: 'surat',
      organization: 'BEM FT UNESA'
    });

    surat.letterNumber = numberStr;
    await surat.save();
    return numberStr;
  }

  // ==========================================
  // LISTING / SEARCH
  // ==========================================

  async findAll(query: SuratQueryDto) {
    const filter: any = { deletedAt: { $exists: false } };

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { sender: { $regex: query.search, $options: 'i' } },
        { recipient: { $regex: query.search, $options: 'i' } },
      ];
    }
    
    if (query.templateId) filter.template = new Types.ObjectId(query.templateId);
    if (query.cabinetPeriodId) filter.cabinetPeriod = new Types.ObjectId(query.cabinetPeriodId);
    if (query.submittedBy) filter.submittedBy = new Types.ObjectId(query.submittedBy);

    // If status filter is applied, we might need an aggregation or populate match since status is in workflowInstance.
    // For simplicity, we can do a lookup or just fetch and filter in memory if small, but lookup is better.
    // Assuming small dataset or basic populate match:
    
    let suratQuery = this.suratModel.find(filter)
      .populate({
        path: 'workflowInstance',
        match: query.status ? { currentState: query.status } : {}
      })
      .populate('template', 'name type')
      .populate('currentVersion')
      .populate('submittedBy', 'name email');

    if (query.sortBy) {
      const sortDesc = query.sortBy.startsWith('-');
      const sortField = sortDesc ? query.sortBy.substring(1) : query.sortBy;
      suratQuery = suratQuery.sort({ [sortField]: sortDesc ? -1 : 1 });
    } else {
      suratQuery = suratQuery.sort({ createdAt: -1 });
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    suratQuery = suratQuery.skip((page - 1) * limit).limit(limit);

    const rawResults = await suratQuery.lean().exec();
    
    // Filter out items where workflowInstance didn't match the populate match
    const results = rawResults.filter(doc => doc.workflowInstance !== null);

    return results;
  }
}
