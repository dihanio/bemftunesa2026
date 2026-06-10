import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DEFAULT_WORKFLOW_DEFINITIONS,
  findWorkflowTransition,
} from '@bemft/workflow';
import type { WorkflowDefinition } from '@bemft/types';
import {
  WorkflowDefinitionRecord,
  WorkflowInstanceRecord,
} from '../database/schema/security';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(WorkflowDefinitionRecord.name)
    private readonly workflowDefinitionModel: Model<WorkflowDefinitionRecord>,
    @InjectModel(WorkflowInstanceRecord.name)
    private readonly workflowInstanceModel: Model<WorkflowInstanceRecord>,
    private readonly auditService: AuditService,
  ) {}

  async ensureDefaultDefinitions() {
    await Promise.all(
      DEFAULT_WORKFLOW_DEFINITIONS.map((definition) =>
        this.workflowDefinitionModel.updateOne(
          { key: definition.key, version: definition.version },
          { $setOnInsert: definition },
          { upsert: true },
        ),
      ),
    );
  }

  async listDefinitions() {
    await this.ensureDefaultDefinitions();

    const definitions = await this.workflowDefinitionModel
      .find({ isActive: true })
      .sort({ key: 1, version: -1 })
      .lean();

    return { data: definitions };
  }

  async upsertDefinition(definition: WorkflowDefinition, actorId?: string) {
    const updated = await this.workflowDefinitionModel.findOneAndUpdate(
      { key: definition.key, version: definition.version },
      { $set: { ...definition, isActive: true } },
      { upsert: true, new: true },
    );

    await this.auditService.record({
      actorId,
      category: 'workflow',
      action: 'workflow.definition.upsert',
      targetType: 'workflow_definition',
      targetId: `${definition.key}@${definition.version}`,
      metadata: { key: definition.key, version: definition.version },
    });

    return { data: updated };
  }

  async startInstance(input: {
    definitionKey: string;
    entityType: string;
    entityId: string;
    actorId: string;
  }) {
    const definition = await this.workflowDefinitionModel
      .findOne({ key: input.definitionKey, isActive: true })
      .sort({ version: -1 })
      .lean();

    if (!definition) {
      throw new NotFoundException('Workflow definition tidak ditemukan');
    }

    const instance = await this.workflowInstanceModel.create({
      definitionKey: definition.key,
      definitionVersion: definition.version,
      entityType: input.entityType,
      entityId: input.entityId,
      currentStep: definition.initialStep,
      status: 'running',
      history: [
        {
          from: null,
          to: definition.initialStep,
          action: 'start',
          actorId: input.actorId,
          createdAt: new Date(),
        },
      ],
    });

    await this.auditService.record({
      actorId: input.actorId,
      category: 'workflow',
      action: 'workflow.instance.start',
      targetType: input.entityType,
      targetId: input.entityId,
      metadata: {
        definitionKey: definition.key,
        definitionVersion: definition.version,
      },
    });

    return { data: instance };
  }

  async transition(
    instanceId: string,
    input: { action: string; note?: string; actorId: string },
  ) {
    const instance = await this.workflowInstanceModel.findById(instanceId);
    if (!instance) {
      throw new NotFoundException('Workflow instance tidak ditemukan');
    }

    const definition = await this.workflowDefinitionModel
      .findOne({
        key: instance.definitionKey,
        version: instance.definitionVersion,
      })
      .lean();

    if (!definition) {
      throw new NotFoundException('Workflow definition tidak ditemukan');
    }

    const transition = findWorkflowTransition(
      definition as unknown as WorkflowDefinition,
      instance.currentStep,
      input.action,
    );

    if (!transition) {
      throw new BadRequestException('Transisi workflow tidak valid');
    }

    const previousStep = instance.currentStep;
    instance.currentStep = transition.to;
    instance.history.push({
      from: previousStep,
      to: transition.to,
      action: input.action,
      actorId: input.actorId,
      note: input.note,
      createdAt: new Date(),
    });

    const terminalStep = definition.steps.find(
      (step: any) => step.id === transition.to && step.terminal,
    );
    if (terminalStep) {
      instance.status = transition.to === 'Archived' ? 'archived' : 'approved';
    }

    await instance.save();

    await this.auditService.record({
      actorId: input.actorId,
      category: 'workflow',
      action: 'workflow.instance.transition',
      targetType: instance.entityType,
      targetId: instance.entityId,
      metadata: {
        instanceId,
        from: previousStep,
        to: transition.to,
        action: input.action,
      },
    });

    return { data: instance };
  }
}
