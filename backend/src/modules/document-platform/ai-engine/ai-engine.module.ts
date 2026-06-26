import { Module, Global } from '@nestjs/common';
import { AiEngineService } from './ai-engine.service';
import { GeminiProviderService } from './gemini-provider.service';

@Global()
@Module({
  providers: [AiEngineService, GeminiProviderService],
  exports: [AiEngineService],
})
export class AiEngineModule {}
