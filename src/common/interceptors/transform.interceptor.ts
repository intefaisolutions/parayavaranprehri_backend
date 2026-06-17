import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponseUtil } from '../utils/api-response.util';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url: string }>();

    return next.handle().pipe(
      map((data) => {
        if (data?.success !== undefined && data?.timestamp !== undefined) {
          return data;
        }

        if (data?.items && data?.meta) {
          return ApiResponseUtil.paginated(
            data,
            'Success',
            200,
            request.url,
          );
        }

        return ApiResponseUtil.success(data, 'Success', 200, undefined, request.url);
      }),
    );
  }
}
