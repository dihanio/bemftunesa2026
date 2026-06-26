import { Injectable, BadRequestException } from '@nestjs/common';
import { DocumentContext } from '../interfaces/document-context.interface';

export interface NumberingToken {
  id: string; // e.g. "SEQUENCE", "YEAR"
  name: string; // e.g. "Nomor Urut", "Tahun"
  description: string;
  category: 'system' | 'date' | 'metadata' | 'organization';
  resolver: (context: DocumentContext, dynamicOptions?: any) => string;
}

@Injectable()
export class TokenRegistryService {
  private tokens: Map<string, NumberingToken> = new Map();

  constructor() {
    this.registerDefaultTokens();
  }

  /**
   * Registers a new token dynamically.
   */
  register(token: NumberingToken) {
    if (this.tokens.has(token.id)) {
      throw new Error(`Token with ID ${token.id} is already registered.`);
    }
    this.tokens.set(token.id, token);
  }

  /**
   * Returns all available tokens.
   */
  list(): NumberingToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Validates if a set of tokens inside a format pattern are all registered.
   */
  validate(formatPattern: string): string[] {
    const regex = /{{(.*?)}}/g;
    let match;
    const missingTokens: string[] = [];

    while ((match = regex.exec(formatPattern)) !== null) {
      const tokenId = match[1].trim();
      // Allow custom metadata prefix if needed, or enforce strict registration
      if (!this.tokens.has(tokenId) && !tokenId.startsWith('CUSTOM_')) {
        missingTokens.push(tokenId);
      }
    }

    return missingTokens;
  }

  /**
   * Resolves a format pattern string using the provided context.
   * Also returns the resolved token map for preview purposes.
   */
  resolve(formatPattern: string, sequence: number, padLength: number, context: DocumentContext): { result: string, resolvedTokens: Record<string, string> } {
    const missing = this.validate(formatPattern);
    if (missing.length > 0) {
      throw new BadRequestException(`Unregistered tokens found in pattern: ${missing.join(', ')}`);
    }

    const resolvedTokens: Record<string, string> = {};
    const regex = /{{(.*?)}}/g;
    
    // We pass sequence into the context dynamically just for resolution
    const extendedContext = { ...context, __sequence: sequence, __padLength: padLength };

    const result = formatPattern.replace(regex, (match, tokenId) => {
      const id = tokenId.trim();
      let resolvedValue = '';

      if (this.tokens.has(id)) {
        const token = this.tokens.get(id)!;
        resolvedValue = token.resolver(extendedContext);
      } else if (id.startsWith('CUSTOM_')) {
        // Fallback for custom metadata if explicitly allowed
        const key = id.replace('CUSTOM_', '');
        resolvedValue = context.metadata?.[key] ? String(context.metadata[key]) : match;
      } else {
        resolvedValue = match; // leave unresolved
      }

      resolvedTokens[id] = resolvedValue;
      return resolvedValue;
    });

    return { result, resolvedTokens };
  }

  private registerDefaultTokens() {
    this.register({
      id: 'SEQUENCE',
      name: 'Sequence Number',
      description: 'Padded sequence number based on configured length (e.g., 001).',
      category: 'system',
      resolver: (ctx: any) => {
        const seq = ctx.__sequence || 1;
        const pad = ctx.__padLength || 3;
        return seq.toString().padStart(pad, '0');
      }
    });

    this.register({
      id: 'YEAR',
      name: 'Current Year',
      description: '4-digit year (e.g., 2026)',
      category: 'date',
      resolver: (ctx) => {
        return (ctx.simulatedDate ? new Date(ctx.simulatedDate) : new Date()).getFullYear().toString();
      }
    });

    this.register({
      id: 'MONTH',
      name: 'Current Month',
      description: '2-digit month (e.g., 07)',
      category: 'date',
      resolver: (ctx) => {
        const date = ctx.simulatedDate ? new Date(ctx.simulatedDate) : new Date();
        return (date.getMonth() + 1).toString().padStart(2, '0');
      }
    });

    this.register({
      id: 'ROMAN_MONTH',
      name: 'Roman Month',
      description: 'Month in Roman numerals (e.g., VII)',
      category: 'date',
      resolver: (ctx) => {
        const date = ctx.simulatedDate ? new Date(ctx.simulatedDate) : new Date();
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return romanMonths[date.getMonth()];
      }
    });

    this.register({
      id: 'DAY',
      name: 'Current Day',
      description: '2-digit day of the month (e.g., 25)',
      category: 'date',
      resolver: (ctx) => {
        const date = ctx.simulatedDate ? new Date(ctx.simulatedDate) : new Date();
        return date.getDate().toString().padStart(2, '0');
      }
    });

    this.register({
      id: 'DOCUMENT_CODE',
      name: 'Document Code',
      description: 'Code of the document type (e.g., SPm, SK)',
      category: 'metadata',
      resolver: (ctx) => ctx.metadata?.documentCode || 'DOC'
    });

    this.register({
      id: 'DOCUMENT_TYPE',
      name: 'Document Type',
      description: 'Type of document in upper case (e.g., SURAT_TUGAS)',
      category: 'metadata',
      resolver: (ctx) => ctx.documentType?.toUpperCase() || 'UNKNOWN'
    });

    this.register({
      id: 'DEPARTMENT',
      name: 'Department',
      description: 'Department Code (e.g., PSDM, DAGRI)',
      category: 'organization',
      resolver: (ctx) => ctx.metadata?.departmentCode || 'DEPT'
    });

    this.register({
      id: 'ORGANIZATION',
      name: 'Organization Name',
      description: 'Organization name (e.g., BEM-FT, HIMA)',
      category: 'organization',
      resolver: (ctx) => ctx.organization || 'ORG'
    });

    this.register({
      id: 'CABINET',
      name: 'Cabinet Name',
      description: 'Cabinet Name Code (e.g., RENGGANIS)',
      category: 'organization',
      resolver: (ctx) => ctx.metadata?.cabinetCode || 'CABINET'
    });

    this.register({
      id: 'PERIOD',
      name: 'Cabinet Period',
      description: 'Academic/Cabinet Year (e.g., 2026-2027)',
      category: 'organization',
      resolver: (ctx) => ctx.metadata?.cabinetPeriodName || 'PERIOD'
    });
  }
}
