import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  use(req: Request, _res: Response, next: NextFunction) {
    this.logger.debug(
      `Incoming ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`,
    );
    next();
  }
}
