import { z } from 'zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  search: z.string().optional(),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;

// Swagger documentation class (for auto-generated docs)
export class PaginationQuerySwagger {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  limit?: number;

  @ApiPropertyOptional({ default: 'createdAt' })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  search?: string;
}
