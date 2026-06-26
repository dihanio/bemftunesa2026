import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkflowDefinition, WorkflowDefinitionDocument } from '../../../schemas/workflow-definition.schema';
import { WorkflowInstance, WorkflowInstanceDocument } from '../../../schemas/workflow-instance.schema';
import { WorkflowSimulatorService } from '../workflow-engine/workflow-simulator.service';
import { WorkflowValidatorService } from '../workflow-engine/workflow-validator.service';

@Injectable()
export class WorkflowManagementService {
  constructor(
    @InjectModel(WorkflowDefinition.name) private workflowDefinitionModel: Model<WorkflowDefinitionDocument>,
    @InjectModel(WorkflowInstance.name) private workflowInstanceModel: Model<WorkflowInstanceDocument>,
    private readonly simulatorService: WorkflowSimulatorService,
    private readonly validatorService: WorkflowValidatorService
  ) {}

  async findAll(query: any = {}) {
    const filter: any = {};
    if (query.documentType) filter.documentType = query.documentType;
    if (query.status) filter.status = query.status;

    return this.workflowDefinitionModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getSummary() {
    const total = await this.workflowDefinitionModel.countDocuments();
    const published = await this.workflowDefinitionModel.countDocuments({ status: 'published' });
    const draft = await this.workflowDefinitionModel.countDocuments({ status: 'draft' });
    const deprecated = await this.workflowDefinitionModel.countDocuments({ status: 'deprecated' });

    return { total, published, draft, deprecated };
  }

  async findOne(id: string) {
    const workflow = await this.workflowDefinitionModel.findById(id).exec();
    if (!workflow) throw new NotFoundException('Workflow definition not found');
    return workflow;
  }

  async findByCode(code: string) {
    return this.workflowDefinitionModel.find({ code }).sort({ version: -1 }).exec();
  }

  async getActiveInstancesCount(workflowId: string) {
    return this.workflowInstanceModel.countDocuments({
      workflowDefinition: new Types.ObjectId(workflowId),
      currentState: { $nin: ['PUBLISHED', 'ARCHIVED', 'CANCELLED'] } // Based on DocumentState legacy
    });
  }

  async create(data: Partial<WorkflowDefinition>) {
    // Generate new code if not provided
    if (!data.code) {
      data.code = `WF_${Date.now()}`;
    }
    data.version = 1;
    data.status = 'draft';
    
    const workflow = new this.workflowDefinitionModel(data);
    return workflow.save();
  }

  async cloneAndIncrementVersion(id: string, userId: Types.ObjectId) {
    const existing = await this.findOne(id);
    
    const newVersion = new this.workflowDefinitionModel({
      code: existing.code,
      name: existing.name,
      description: existing.description,
      documentType: existing.documentType,
      version: existing.version + 1,
      status: 'draft',
      createdBy: userId,
      stages: existing.stages,
      transitions: existing.transitions,
    });

    return newVersion.save();
  }

  async update(id: string, data: Partial<WorkflowDefinition>) {
    const workflow = await this.findOne(id);
    if (workflow.status !== 'draft') {
      throw new BadRequestException('Only draft workflows can be modified. Clone this to create a new version.');
    }

    return this.workflowDefinitionModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async publish(id: string, userId: Types.ObjectId) {
    const workflow = await this.findOne(id);
    
    // Validate workflow before publishing
    const validationResult = this.validatorService.validateDefinition(workflow);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Workflow validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Deprecate previous active versions
    await this.workflowDefinitionModel.updateMany(
      { code: workflow.code, status: 'published' },
      { $set: { status: 'deprecated' } }
    );

    workflow.status = 'published';
    workflow.publishedBy = userId;
    workflow.publishedAt = new Date();
    
    return workflow.save();
  }
  
  async simulate(id: string, payload: any) {
    const workflow = await this.findOne(id);
    return this.simulatorService.simulate(
      workflow,
      payload.documentData || {},
      payload.userRolesByStage || {},
      payload.actionsSequence || []
    );
  }

  async validate(id: string) {
    const workflow = await this.findOne(id);
    return this.validatorService.validateDefinition(workflow);
  }
}
