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
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.REPORTS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create (generate) a new Report' })
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.REPORTS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List Reports (paginated, searchable, sortable)' })
  findAll(@Query() query: ReportQueryDto) {
    return this.reportsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.REPORTS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a Report by ID' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.REPORTS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a Report' })
  update(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.REPORTS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a Report' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
