import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as Handlebars from 'handlebars';
import { DocumentTemplate, DocumentTemplateDocument } from '../../../schemas/document-template.schema';
import { Surat, SuratDocument } from '../../../schemas/surat.schema';
import { MockGoogleDriveProvider } from './providers/mock-google-drive.provider';
import { TemplateEngineService } from '../template-engine/template-engine.service';

@Injectable()
export class TemplateManagementService {
  constructor(
    @InjectModel(DocumentTemplate.name) private templateModel: Model<DocumentTemplateDocument>,
    @InjectModel(Surat.name) private suratModel: Model<SuratDocument>, // To count usage
    private googleDriveProvider: MockGoogleDriveProvider,
    private templateEngineService: TemplateEngineService,
  ) {}

  async findAll(filters?: any): Promise<any[]> {
    const matchFilters = { ...filters };
    if (matchFilters.status === 'all') {
      delete matchFilters.status;
    }
    
    // Return latest version of each code by default, unless specific filters are applied
    const templates = await this.templateModel.aggregate([
      { $match: matchFilters },
      { $sort: { version: -1 } },
      {
        $group: {
          _id: "$code",
          latestTemplate: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestTemplate" } },
      { $sort: { order: 1, name: 1 } }
    ]);
    return templates;
  }

  async findById(id: string): Promise<DocumentTemplateDocument> {
    const template = await this.templateModel.findById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async getVersionHistory(code: string): Promise<DocumentTemplateDocument[]> {
    return this.templateModel.find({ code }).sort({ version: -1 }).exec();
  }

  async getUsageStats(id: string): Promise<any> {
    // Currently only checking Surat, but could be extended to Proposal, LPJ, etc.
    const count = await this.suratModel.countDocuments({ template: id });
    return {
      totalUsage: count,
      byType: {
        surat: count,
        proposal: 0,
        lpj: 0
      }
    };
  }

  async syncFromDrive(dto: { code: string, name: string, documentType: string, category: string, googleDriveUrl: string, description?: string }): Promise<DocumentTemplateDocument> {
    const content = await this.googleDriveProvider.fetchContent(dto.googleDriveUrl);
    
    // Check if code exists to determine version
    const existingTemplates = await this.templateModel.find({ code: dto.code }).sort({ version: -1 }).limit(1);
    const newVersion = existingTemplates.length > 0 ? existingTemplates[0].version + 1 : 1;

    const newTemplate = new this.templateModel({
      code: dto.code,
      name: dto.name,
      documentType: dto.documentType,
      category: dto.category,
      description: dto.description || '',
      version: newVersion,
      status: 'draft',
      sourceType: content.sourceType,
      googleDriveUrl: dto.googleDriveUrl,
      lastSyncedAt: new Date(),
      workflow: existingTemplates.length > 0 ? existingTemplates[0].workflow : [],
    });

    return newTemplate.save();
  }

  async validateTemplate(id: string): Promise<any> {
    const template = await this.findById(id);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const infos: string[] = [];

    // 4. Workflow Check
    if (!template.workflow || template.workflow.length === 0) {
      errors.push('Workflow is empty. Document cannot be processed without a workflow.');
    }

    const isValid = errors.length === 0;

    // If valid and currently draft, we can optionally move to validated status
    if (isValid && template.status === 'draft') {
      template.status = 'validated';
      await template.save();
    }

    return {
      isValid,
      errors,
      warnings,
      infos,
      extractedPlaceholders: []
    };
  }

  async publishTemplate(id: string): Promise<DocumentTemplateDocument> {
    const template = await this.findById(id);

    if (template.status === 'published') {
      throw new BadRequestException('Template is already published');
    }

    if (template.status === 'draft') {
      // Auto-validate first
      const validation = await this.validateTemplate(id);
      if (!validation.isValid) {
        throw new BadRequestException('Cannot publish template with validation errors');
      }
    }

    // Deprecate previous active version
    await this.templateModel.updateMany(
      { code: template.code, status: 'published' },
      { $set: { status: 'deprecated' } }
    );

    // Publish current
    template.status = 'published';
    return template.save();
  }

  async updateTemplateData(id: string, updateData: any): Promise<DocumentTemplateDocument> {
    const template = await this.findById(id);
    if (template.status === 'published' || template.status === 'deprecated') {
      throw new BadRequestException('Cannot modify published or deprecated templates. Create a new version instead.');
    }

    Object.assign(template, updateData);
    return template.save();
  }

  async getPreview(id: string, customData?: Record<string, any>): Promise<string> {
    const template = await this.findById(id);
    return `<div style="padding: 20px; text-align: center;">
      <h3>Preview Unavailable</h3>
      <p>This template is hosted on Google Drive.</p>
      ${template.googleDriveUrl ? `<a href="${template.googleDriveUrl}" target="_blank" style="color: blue; text-decoration: underline;">View on Google Drive</a>` : ''}
    </div>`;
  }

  async deprecateTemplate(id: string): Promise<DocumentTemplateDocument> {
    const template = await this.findById(id);
    if (template.status !== 'published') {
      throw new BadRequestException('Only published templates can be deprecated');
    }
    template.status = 'deprecated';
    return template.save();
  }
}
