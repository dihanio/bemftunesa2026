import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, AiGenerationOptions, AiGenerationResult } from './ai-provider.interface';

@Injectable()
export class GeminiProviderService implements AiProvider {
  readonly name = 'gemini';
  readonly modelName = 'gemini-1.5-flash'; // or pro

  constructor(private readonly configService: ConfigService) {}

  async generateData(options: AiGenerationOptions): Promise<AiGenerationResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    // Build the instruction
    const keysToFill = options.placeholders
      .filter(p => p.aiFillable)
      .map(p => `"${p.key}" (${p.type}): ${p.label}`)
      .join('\n');

    let systemInstruction = `You are a strict data extraction assistant. 
Your ONLY task is to return a valid JSON object matching these exact keys:
${keysToFill}

Do NOT wrap the output in markdown code blocks. Do NOT include any HTML. Do NOT return anything other than the JSON object.`;

    let userPrompt = options.prompt;
    if (options.revisionNote && options.previousData) {
      systemInstruction += `\n\nThis is a REVISION. Update the previous JSON based on the revision note.`;
      userPrompt = `Previous Data: ${JSON.stringify(options.previousData)}\n\nRevision Note: ${options.revisionNote}`;
    }

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
      }
    };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsedJson = JSON.parse(responseText);

      return {
        success: true,
        data: parsedJson,
        provider: this.name,
        model: this.modelName,
        rawPrompt: userPrompt,
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        provider: this.name,
        model: this.modelName,
        rawPrompt: userPrompt,
        error: error.message,
      };
    }
  }
}
