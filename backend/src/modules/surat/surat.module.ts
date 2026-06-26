import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Surat, SuratSchema } from '../../schemas/surat.schema';
import { SuratService } from './surat.service';
import { SuratController } from './surat.controller';
import { MediaModule } from '../../media/media.module';

import { DocumentTemplate, DocumentTemplateSchema } from '../../schemas/document-template.schema';
import { NumberingEngineModule } from '../document-platform/numbering-engine/numbering-engine.module';

import { DocumentVersion, DocumentVersionSchema } from '../../schemas/document-version.schema';
import { WorkflowInstance, WorkflowInstanceSchema } from '../../schemas/workflow-instance.schema';
import { WorkflowDefinition, WorkflowDefinitionSchema } from '../../schemas/workflow-definition.schema';
import { WorkflowEngineModule } from '../document-platform/workflow-engine/workflow-engine.module';
import { TemplateEngineModule } from '../document-platform/template-engine/template-engine.module';
import { ExportEngineModule } from '../document-platform/export-engine/export-engine.module';
import { AiEngineModule } from '../document-platform/ai-engine/ai-engine.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentVersion.name, schema: DocumentVersionSchema },
      { name: Surat.name, schema: SuratSchema },
      { name: DocumentTemplate.name, schema: DocumentTemplateSchema },
      { name: WorkflowInstance.name, schema: WorkflowInstanceSchema },
      { name: WorkflowDefinition.name, schema: WorkflowDefinitionSchema },
    ]),
    MediaModule,
    NumberingEngineModule,
    WorkflowEngineModule,
    TemplateEngineModule,
    ExportEngineModule,
    AiEngineModule,
  ],
  controllers: [SuratController],
  providers: [SuratService],
})
export class SuratModule {}
