import { Injectable, BadRequestException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { DocumentContext, RenderOptions, RenderResult } from '../interfaces/document-context.interface';

// Interface defining a generic template source
export interface TemplateSource {
  content: string; // The raw template content (e.g., HTML string)
  format: 'html' | 'markdown' | 'text'; // Future-proofing for other template formats
  placeholders: {
    key: string;
    required: boolean;
  }[];
}

@Injectable()
export class TemplateEngineService {
  constructor() {
    this.registerHelpers();
  }

  /**
   * Render a template using the provided context and options.
   */
  async render(
    template: TemplateSource,
    context: DocumentContext,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const startTime = Date.now();

    // 1. Validate mandatory placeholders if strict mode is enabled
    const missingPlaceholders: string[] = [];
    if (options.strict) {
      for (const placeholder of template.placeholders) {
        if (placeholder.required && !context.documentData[placeholder.key]) {
          missingPlaceholders.push(placeholder.key);
        }
      }

      if (missingPlaceholders.length > 0) {
        throw new BadRequestException(
          `Missing required placeholders: ${missingPlaceholders.join(', ')}`
        );
      }
    }

    // 2. Compile and render (currently supports HTML/Handlebars)
    let renderedContent = '';
    
    if (template.format === 'html' || template.format === 'text') {
      try {
        const compiledTemplate = Handlebars.compile(template.content, { strict: false });
        // Expose both documentData and context metadata to Handlebars
        const templateData = {
          ...context.documentData,
          _meta: {
            documentType: context.documentType,
            organization: context.organization,
            currentUser: context.currentUser,
          }
        };
        renderedContent = compiledTemplate(templateData);
      } catch (error) {
        throw new BadRequestException(`Failed to render template: ${error.message}`);
      }
    } else {
      throw new BadRequestException(`Unsupported template format: ${template.format}`);
    }

    return {
      content: renderedContent,
      metadata: {
        missingPlaceholders: missingPlaceholders.length > 0 ? missingPlaceholders : undefined,
        renderTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Register custom Handlebars helpers that might be useful across templates.
   */
  private registerHelpers() {
    // Example: uppercase helper
    Handlebars.registerHelper('uppercase', (str) => {
      if (typeof str === 'string') {
        return str.toUpperCase();
      }
      return str;
    });

    // Example: date formatting helper (simplified)
    Handlebars.registerHelper('formatDate', (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', month: 'long', day: 'numeric' 
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    });

    // Default fallback helper
    Handlebars.registerHelper('default', (value, defaultValue) => {
      return value ? value : defaultValue;
    });
  }
}
