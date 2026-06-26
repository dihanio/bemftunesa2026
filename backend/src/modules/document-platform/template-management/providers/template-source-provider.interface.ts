export interface TemplateSourceContent {
  htmlContent: string;
  sourceType: string;
  metadata?: Record<string, any>;
}

export interface TemplateSourceProvider {
  /**
   * Identifies the provider (e.g., 'google-drive', 'local', 'mock')
   */
  getProviderName(): string;

  /**
   * Fetches the template content from the source URL or ID
   */
  fetchContent(sourceIdOrUrl: string): Promise<TemplateSourceContent>;
}
