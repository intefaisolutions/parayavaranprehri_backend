import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { MaintenanceLogsService } from './maintenance-logs.service';

@ApiTags('Maintenance Logs')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'maintenance-logs', version: '1' })
export class MaintenanceLogsController {
  constructor(
    private readonly maintenanceLogsService: MaintenanceLogsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a maintenance log entry' })
  create(
    @Body() dto: CreateMaintenanceLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceLogsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List maintenance logs (own by default; admins see all)',
  })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('treeCode') treeCode?: string,
    @Query('mine') mine?: string,
  ) {
    return this.maintenanceLogsService.findAll(user, { treeCode, mine });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a maintenance log by ID' })
  findOne(@Param('id') id: string) {
    return this.maintenanceLogsService.findOne(id);
  }
}
