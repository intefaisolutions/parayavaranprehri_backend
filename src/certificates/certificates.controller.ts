import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CertificateTemplatesService } from './certificate-templates.service';
import { CertificatesService } from './certificates.service';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@ApiTags('Certificates')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'certificates', version: '1' })
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly templatesService: CertificateTemplatesService,
  ) {}

  // ---------- Certificate Templates ----------

  @Post('templates')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a certificate template' })
  createTemplate(@Body() dto: CreateCertificateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get('templates')
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List certificate templates' })
  findAllTemplates(@Query('search') search?: string) {
    return this.templatesService.findAll(search);
  }

  @Get('templates/:id')
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a certificate template by ID' })
  findOneTemplate(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch('templates/:id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a certificate template' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateCertificateTemplateDto,
  ) {
    return this.templatesService.update(id, dto);
  }

  @Delete('templates/:id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a certificate template' })
  removeTemplate(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  // ---------- Issued Certificates ----------

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Publicly verify a certificate by its code' })
  verify(@Param('code') code: string) {
    return this.certificatesService.verify(code);
  }

  @Get('mitra/:mitraId')
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List all certificates issued to a Mitra' })
  findByMitra(@Param('mitraId') mitraId: string) {
    return this.certificatesService.findByRecipient(mitraId);
  }

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Issue a certificate to a volunteer (Mitra) or user' })
  issue(@Body() dto: CreateCertificateDto) {
    return this.certificatesService.issue(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List issued certificates' })
  findAll(
    @Query('status') status?: string,
    @Query('recipientType') recipientType?: string,
    @Query('search') search?: string,
  ) {
    return this.certificatesService.findAll({ status, recipientType, search });
  }

  @Get(':id')
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get an issued certificate by ID' })
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Post(':id/share-whatsapp')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Share an issued certificate with the recipient via WhatsApp' })
  shareViaWhatsapp(@Param('id') id: string) {
    return this.certificatesService.shareViaWhatsapp(id);
  }

  @Patch(':id/revoke')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Revoke an issued certificate' })
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update an issued certificate' })
  update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) {
    return this.certificatesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CERTIFICATES}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete an issued certificate' })
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }
}
