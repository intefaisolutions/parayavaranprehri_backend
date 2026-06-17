import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

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
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
