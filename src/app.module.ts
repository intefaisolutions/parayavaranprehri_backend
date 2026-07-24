import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { GreenSelfiesModule } from './modules/green-selfies/green-selfies.module';
import { LandOffersModule } from './modules/land-offers/land-offers.module';
import { StaticDataModule } from './modules/static-data/static-data.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { PersonsModule } from './persons/persons.module';
import { TreesModule } from './trees/trees.module';
import { PersonIdentityModule } from './person-identity/person-identity.module';
import { MitrasModule } from './mitras/mitras.module';
import { TasksModule } from './tasks/tasks.module';
import { VidhanSabhasModule } from './vidhan-sabhas/vidhan-sabhas.module';
import { LocationsModule } from './locations/locations.module';
import { MapsModule } from './maps/maps.module';
import { NewsModule } from './news/news.module';
import { MediaModule } from './media/media.module';
import { LeadersModule } from './leaders/leaders.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PartnersModule } from './partners/partners.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CallCenterModule } from './call-center/call-center.module';
import { LanguagesModule } from './languages/languages.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { UploadsModule } from './uploads/uploads.module';
import { RashiTreesModule } from './rashi-trees/rashi-trees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    CommonModule,
    AuthModule,
    RolesModule,
    UsersModule,
    VehiclesModule,
    GreenSelfiesModule,
    LandOffersModule,
    StaticDataModule,
    GamificationModule,
    PersonsModule,
    TreesModule,
    PersonIdentityModule,
    MitrasModule,
    TasksModule,
    VidhanSabhasModule,
    LocationsModule,
    MapsModule,
    NewsModule,
    MediaModule,
    LeadersModule,
    CertificatesModule,
    PartnersModule,
    NotificationsModule,
    CallCenterModule,
    LanguagesModule,
    ReportsModule,
    SettingsModule,
    AuditLogsModule,
    UploadsModule,
    RashiTreesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
