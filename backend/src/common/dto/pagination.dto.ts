import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = '-createdAt';

  @IsOptional()
  @IsString()
  search?: string;
}

export function buildPaginateQuery(query: PaginationQueryDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const sortObj: Record<string, 1 | -1> = {};
  if (query.sort) {
    const sortField = query.sort.startsWith('-')
      ? query.sort.slice(1)
      : query.sort;
    const sortOrder = query.sort.startsWith('-') ? -1 : 1;
    sortObj[sortField] = sortOrder;
  } else {
    sortObj['createdAt'] = -1;
  }

  return { page, limit, skip, sortObj };
}

export function buildPaginateResponse(
  data: unknown[],
  total: number,
  query: PaginationQueryDto,
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
