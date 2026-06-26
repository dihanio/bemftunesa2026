import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentTemplate, DocumentTemplateSchema } from '../../../schemas/document-template.schema';
import { Surat, SuratSchema } from '../../../schemas/surat.schema';
import { TemplateManagementController } from './template-management.controller';
import { TemplateManagementService } from './template-management.service';
import { MockGoogleDriveProvider } from './providers/mock-google-drive.provider';
import { TemplateEngineModule } from '../template-engine/template-engine.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentTemplate.name, schema: DocumentTemplateSchema },
      { name: Surat.name, schema: SuratSchema },
    ]),
    TemplateEngineModule
  ],
  controllers: [TemplateManagementController],
  providers: [
    TemplateManagementService,
    MockGoogleDriveProvider,
  ],
  exports: [TemplateManagementService]
})
export class TemplateManagementModule {}
