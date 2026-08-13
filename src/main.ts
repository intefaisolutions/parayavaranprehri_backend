import * as dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Disable default ~100kb parser — GeoJSON boundaries often exceed it
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  app.use(helmet());

  const corsOrigins = configService.get<string>('CORS_ORIGINS') ?? '*';
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(','),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Paryavaran API')
    .setDescription(
      'Carbon Offset & Tree Plantation Management Platform - Enterprise REST API',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication - JWT, OTP, Refresh Token')
    .addTag('Users', 'User management with RBAC')
    .addTag('Roles', 'Roles & Permissions management')
    .addTag('Health', 'Service health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT') ?? 3000;
  // Listen on all interfaces so phone/APK on same Wi‑Fi can reach this PC
  await app.listen(port, '0.0.0.0');

  logger.log(`Application running on: http://localhost:${port}/api/v1`);
  logger.log(`LAN (phone/APK): http://<your-pc-ip>:${port}/api/v1`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
