import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NumberingEngineService } from './numbering-engine.service';
import { TokenRegistryService } from './token-registry.service';
import { DocumentNumberingFormatSchema } from '../../../schemas/document-numbering-format.schema';
import { DocumentSequenceSchema } from '../../../schemas/document-sequence.schema';
import { DocumentSequenceHistorySchema } from '../../../schemas/document-sequence-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DocumentNumberingFormat', schema: DocumentNumberingFormatSchema },
      { name: 'DocumentSequence', schema: DocumentSequenceSchema },
      { name: 'DocumentSequenceHistory', schema: DocumentSequenceHistorySchema },
    ]),
  ],
  providers: [NumberingEngineService, TokenRegistryService],
  exports: [NumberingEngineService, TokenRegistryService],
})
export class NumberingEngineModule {}
