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
import { CreateRashiTreeDto } from './dto/create-rashi-tree.dto';
import { RashiTreeQueryDto } from './dto/rashi-tree-query.dto';
import { UpdateRashiTreeDto } from './dto/update-rashi-tree.dto';
import { RashiTreesService } from './rashi-trees.service';

@ApiTags('Rashi Trees')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'rashi-trees', version: '1' })
export class RashiTreesController {
  constructor(private readonly rashiTreesService: RashiTreesService) {}

  // ---------- Public (end-user) lookups ----------
  // NOTE: these static routes must stay above the ":id" routes below so
  // Nest doesn't try to match "by-rashi"/"by-dob" as an :id value.

  @Public()
  @Get('by-rashi/:rashi')
  @ApiOperation({ summary: 'Get the recommended tree for a manually selected Rashi' })
  findByRashi(@Param('rashi') rashi: string) {
    return this.rashiTreesService.findByRashiPublic(rashi);
  }

  @Public()
  @Get('by-dob')
  @ApiOperation({
    summary: 'Get the recommended tree by auto-calculating the Rashi from a date of birth',
  })
  findByDob(@Query('dob') dob: string) {
    return this.rashiTreesService.findByDobPublic(dob);
  }

  // ---------- Admin management ----------

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.RASHI_TREES}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new Rashi tree recommendation' })
  create(@Body() dto: CreateRashiTreeDto) {
    return this.rashiTreesService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.RASHI_TREES}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List Rashi tree recommendations (paginated, searchable, sortable)' })
  findAll(@Query() query: RashiTreeQueryDto) {
    return this.rashiTreesService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.RASHI_TREES}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a Rashi tree recommendation by ID' })
  findOne(@Param('id') id: string) {
    return this.rashiTreesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.RASHI_TREES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Activate or deactivate a Rashi tree recommendation' })
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.rashiTreesService.setActive(id, isActive);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.RASHI_TREES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a Rashi tree recommendation' })
  update(@Param('id') id: string, @Body() dto: UpdateRashiTreeDto) {
    return this.rashiTreesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.RASHI_TREES}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a Rashi tree recommendation' })
  remove(@Param('id') id: string) {
    return this.rashiTreesService.remove(id);
  }
}
