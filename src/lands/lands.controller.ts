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
import { CreateLandDto } from './dto/create-land.dto';
import { LandQueryDto } from './dto/land-query.dto';
import { UpdateLandDto } from './dto/update-land.dto';
import { LandsService } from './lands.service';

@ApiTags('Lands')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'lands', version: '1' })
export class LandsController {
  constructor(private readonly landsService: LandsService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANDS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Register a plantation land parcel' })
  create(@Body() dto: CreateLandDto) {
    return this.landsService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.LANDS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List lands' })
  findAll(@Query() query: LandQueryDto) {
    return this.landsService.findAll(query);
  }

  @Get('dashboard/ownership')
  @Permissions(`${PermissionResource.LANDS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'Land dashboard grouped by ownership type' })
  ownershipDashboard() {
    return this.landsService.dashboardByOwnership();
  }

  @Get(':id')
  @Permissions(`${PermissionResource.LANDS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get land by ID' })
  findOne(@Param('id') id: string) {
    return this.landsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANDS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update land' })
  update(@Param('id') id: string, @Body() dto: UpdateLandDto) {
    return this.landsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANDS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Soft-delete land' })
  remove(@Param('id') id: string) {
    return this.landsService.remove(id);
  }
}
