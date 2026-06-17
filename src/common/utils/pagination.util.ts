import {
  MongoFilter,
  PaginationOptions,
  PaginationQuery,
} from '../interfaces/pagination.interface';

export class PaginationUtil {
  static parse(query: PaginationQuery): PaginationOptions {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = query.search?.trim() || undefined;

    return { page, limit, sortBy, sortOrder, search };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static buildSort(sortBy: string, sortOrder: 'asc' | 'desc') {
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;
  }

  static buildSearchFilter(
    search: string | undefined,
    fields: string[],
  ): MongoFilter {
    if (!search) return {};

    return {
      $or: fields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      })),
    };
  }

  static mergeFilters(...filters: MongoFilter[]): MongoFilter {
    const active = filters.filter((f) => Object.keys(f).length > 0);
    if (active.length === 0) return {};
    if (active.length === 1) return active[0];
    return { $and: active };
  }
}
