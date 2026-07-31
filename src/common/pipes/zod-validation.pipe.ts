import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';
import { formatZodErrors } from '../utils/zod-error.util';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const details = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');

      throw new BadRequestException({
        message: details
          ? `Validation failed — ${details}`
          : 'Validation failed',
        errors,
      });
    }

    return result.data;
  }
}
