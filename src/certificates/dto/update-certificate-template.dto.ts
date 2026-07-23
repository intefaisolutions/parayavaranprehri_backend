import { PartialType } from '@nestjs/mapped-types';
import { CreateCertificateTemplateDto } from './create-certificate-template.dto';

export class UpdateCertificateTemplateDto extends PartialType(
  CreateCertificateTemplateDto,
) {}
