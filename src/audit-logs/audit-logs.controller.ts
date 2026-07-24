import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.AUDIT_LOGS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a manual audit log entry' })
  create(
    @Body() dto: CreateAuditLogDto,
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    return this.auditLogsService.create(dto, user, ip);
  }

  @Get()
  @Permissions(`${PermissionResource.AUDIT_LOGS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List audit logs (paginated, searchable, sortable)' })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.AUDIT_LOGS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get an audit log by ID' })
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.AUDIT_LOGS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update an audit log entry' })
  update(@Param('id') id: string, @Body() dto: UpdateAuditLogDto) {
    return this.auditLogsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.AUDIT_LOGS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete an audit log entry' })
  remove(@Param('id') id: string) {
    return this.auditLogsService.remove(id);
  }
}
