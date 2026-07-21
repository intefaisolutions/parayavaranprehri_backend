import {
  ApiResponse,
  PaginatedMeta,
  PaginatedResult,
} from '../interfaces/api-response.interface';

export class ApiResponseUtil {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: Record<string, unknown>,
    path = '',
  ): ApiResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static paginated<T>(
    result: PaginatedResult<T>,
    message = 'Success',
    statusCode = 200,
    path = '',
  ): ApiResponse<T[]> {
    return {
      success: true,
      statusCode,
      message,
      data: result.items,
      meta: result.meta as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static buildMeta(page: number, limit: number, total: number): PaginatedMeta {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
