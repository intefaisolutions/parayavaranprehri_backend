import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MitrasModule } from '../mitras/mitras.module';
import { CertificateTemplatesService } from './certificate-templates.service';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import {
  CertificateTemplate,
  CertificateTemplateSchema,
} from './schemas/certificate-template.schema';
import { Certificate, CertificateSchema } from './schemas/certificate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CertificateTemplate.name, schema: CertificateTemplateSchema },
      { name: Certificate.name, schema: CertificateSchema },
    ]),
    MitrasModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateTemplatesService],
  exports: [CertificatesService, CertificateTemplatesService],
})
export class CertificatesModule {}
