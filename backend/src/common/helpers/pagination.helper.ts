import { Model } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
  };
}

/**
 * Escape special regex characters to prevent ReDoS and regex injection.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function paginate<T>(
  model: Model<T>,
  filter: Record<string, any> = {},
  options: PaginationOptions = {},
  searchFields: string[] = [],
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  // Build search filter with escaped regex
  const searchFilter: Record<string, any> = {};
  if (options.search && searchFields.length > 0) {
    const escapedSearch = escapeRegex(options.search);
    searchFilter.$or = searchFields.map((field) => ({
      [field]: { $regex: escapedSearch, $options: 'i' },
    }));
  }

  // Combine filters + soft delete exclusion
  const combinedFilter: Record<string, any> = {
    ...filter,
    ...searchFilter,
    deletedAt: { $eq: null },
  };

  const [data, totalDocs] = await Promise.all([
    model
      .find(combinedFilter)
      .sort({ [sortBy]: sortOrder } as any)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    model.countDocuments(combinedFilter),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
    },
  };
}

export function parsePaginationQuery(query: any): PaginationOptions {
  return {
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? parseInt(query.limit, 10) : 10,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    search: query.search || undefined,
  };
}
