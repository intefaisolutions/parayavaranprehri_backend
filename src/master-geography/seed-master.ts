/**
 * One-time / repeatable master geography seeder.
 *
 *   pnpm run seed:master
 *   pnpm run seed:master -- --reset
 */
import * as dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MasterGeographySeedService } from './master-geography.seed';

async function bootstrap() {
  const logger = new Logger('SeedMaster');
  const reset = process.argv.includes('--reset');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seeder = app.get(MasterGeographySeedService);
    const summary = await seeder.seedFromFile({ reset });
    logger.log('✅ Master geography seed complete');
    logger.log(JSON.stringify(summary, null, 2));
    logger.log('Next: GET /api/v1/geo/constituencies?state=Madhya Pradesh&district=Dewas');
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
