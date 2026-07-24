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
import { CreateMapDto } from './dto/create-map.dto';
import { MapQueryDto } from './dto/map-query.dto';
import { UpdateMapDto } from './dto/update-map.dto';
import { MapsService } from './maps.service';

@ApiTags('Maps')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'maps', version: '1' })
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MAPS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new map record' })
  create(@Body() dto: CreateMapDto) {
    return this.mapsService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.MAPS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List map records (paginated, searchable, sortable)' })
  findAll(@Query() query: MapQueryDto) {
    return this.mapsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.MAPS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a map record by ID' })
  findOne(@Param('id') id: string) {
    return this.mapsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MAPS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a map record' })
  update(@Param('id') id: string, @Body() dto: UpdateMapDto) {
    return this.mapsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MAPS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a map record' })
  remove(@Param('id') id: string) {
    return this.mapsService.remove(id);
  }
}
