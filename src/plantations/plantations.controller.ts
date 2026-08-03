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
import { CreatePlantationDto } from './dto/create-plantation.dto';
import { PlantationQueryDto } from './dto/plantation-query.dto';
import { ReviewPlantationDto } from './dto/review-plantation.dto';
import { UpdatePlantationDto } from './dto/update-plantation.dto';
import { PlantationsService } from './plantations.service';

@ApiTags('Plantations')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'plantations', version: '1' })
export class PlantationsController {
  constructor(private readonly plantationsService: PlantationsService) {}

  @Post()
  @Roles(
    SystemRole.SUPER_ADMIN,
    SystemRole.ADMIN,
    SystemRole.FIELD_OFFICER,
    SystemRole.CUSTOMER,
  )
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create plantation request (pending approval)' })
  create(@Body() dto: CreatePlantationDto) {
    return this.plantationsService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List plantation requests' })
  findAll(@Query() query: PlantationQueryDto) {
    return this.plantationsService.findAll(query);
  }

  @Get('dashboard/by-tree-master')
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'Dashboard totals grouped by Tree Master' })
  dashboard() {
    return this.plantationsService.dashboardByTreeMaster();
  }

  @Get(':id')
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.READ}`)
  findOne(@Param('id') id: string) {
    return this.plantationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.FIELD_OFFICER)
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.UPDATE}`)
  update(@Param('id') id: string, @Body() dto: UpdatePlantationDto) {
    return this.plantationsService.update(id, dto);
  }

  @Patch(':id/review')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.APPROVE}`)
  @ApiOperation({ summary: 'Approve / reject / mark planted' })
  review(@Param('id') id: string, @Body() dto: ReviewPlantationDto) {
    return this.plantationsService.review(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PLANTATIONS}:${PermissionAction.DELETE}`)
  remove(@Param('id') id: string) {
    return this.plantationsService.remove(id);
  }
}
