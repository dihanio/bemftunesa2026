import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GeminiProviderService } from './gemini-provider.service';
import { AiGenerationOptions, AiGenerationResult } from './ai-provider.interface';

@Injectable()
export class AiEngineService {
  constructor(
    private readonly geminiProvider: GeminiProviderService
    // We could inject an array of AiProviders and select based on config
  ) {}

  async generate(options: AiGenerationOptions): Promise<AiGenerationResult> {
    // Currently hardcoded to use Gemini. Future: select from config
    const provider = this.geminiProvider;
    
    try {
      return await provider.generateData(options);
    } catch (error) {
      throw new InternalServerErrorException(`AI Generation failed: ${error.message}`);
    }
  }
}
