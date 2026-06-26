

export interface AiGenerationOptions {
  prompt: string;
  placeholders: any[];
  previousData?: Record<string, any>;
  revisionNote?: string;
}

export interface AiGenerationResult {
  success: boolean;
  data: Record<string, any>;
  provider: string;
  model: string;
  rawPrompt: string;
  error?: string;
}

export interface AiProvider {
  /**
   * Identifies the provider (e.g., 'gemini', 'openai')
   */
  readonly name: string;

  /**
   * Identifies the specific model being used (e.g., 'gemini-1.5-flash')
   */
  readonly modelName: string;

  /**
   * Generates or revises JSON data for the provided placeholders based on the prompt.
   */
  generateData(options: AiGenerationOptions): Promise<AiGenerationResult>;
}
