import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NumberingManagementController } from './numbering-management.controller';
import { NumberingManagementService } from './numbering-management.service';
import { NumberingEngineModule } from '../numbering-engine/numbering-engine.module';
import { DocumentNumberingFormatSchema } from '../../../schemas/document-numbering-format.schema';
import { DocumentSequenceSchema } from '../../../schemas/document-sequence.schema';

@Module({
  imports: [
    NumberingEngineModule,
    MongooseModule.forFeature([
      { name: 'DocumentNumberingFormat', schema: DocumentNumberingFormatSchema },
      { name: 'DocumentSequence', schema: DocumentSequenceSchema },
    ]),
  ],
  controllers: [NumberingManagementController],
  providers: [NumberingManagementService],
  exports: [NumberingManagementService],
})
export class NumberingManagementModule {}
