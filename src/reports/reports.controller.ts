import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List Reports (public metadata for admin preview)',
  })
  findAll(@Query() query: ReportQueryDto) {
    return this.reportsService.findAll(query);
  }

  @Public()
  @Get('monthly-plantations')
  @ApiOperation({
    summary:
      'Monthly plantation counts (for Admin Preview / Mitra charts). Query: months, vidhanSabha, mitraId',
  })
  monthlyPlantations(
    @Query('months') months?: string,
    @Query('vidhanSabha') vidhanSabha?: string,
    @Query('mitraId') mitraId?: string,
  ) {
    return this.reportsService.getMonthlyPlantations({
      months: months ? Number(months) : 6,
      vidhanSabha,
      mitraId,
    });
  }

  @Get(':id/download')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.REPORTS}:${PermissionAction.READ}`)
  @ApiOperation({
    summary: 'Download a generated Report file (PDF or CSV/Excel)',
  })
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.reportsService.buildDownload(id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.setHeader('Content-Length', String(file.buffer.length));
    res.send(file.buffer);
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
