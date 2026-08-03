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
import { CreateTreeMasterDto } from './dto/create-tree-master.dto';
import { TreeMasterQueryDto } from './dto/tree-master-query.dto';
import { UpdateTreeMasterDto } from './dto/update-tree-master.dto';
import { TreeMastersService } from './tree-masters.service';

@ApiTags('Tree Masters')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'tree-masters', version: '1' })
export class TreeMastersController {
  constructor(private readonly treeMastersService: TreeMastersService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.TREE_MASTERS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a Tree Master catalog entry' })
  create(@Body() dto: CreateTreeMasterDto) {
    return this.treeMastersService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.TREE_MASTERS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List Tree Master catalog' })
  findAll(@Query() query: TreeMasterQueryDto) {
    return this.treeMastersService.findAll(query);
  }

  @Get('catalog')
  @Permissions(`${PermissionResource.TREE_MASTERS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'Public-style catalog (active + plantable)' })
  catalog(@Query() query: TreeMasterQueryDto) {
    return this.treeMastersService.findAll({ ...query, catalogOnly: true });
  }

  @Get(':id')
  @Permissions(`${PermissionResource.TREE_MASTERS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get Tree Master by ID' })
  findOne(@Param('id') id: string) {
    return this.treeMastersService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.TREE_MASTERS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update Tree Master' })
  update(@Param('id') id: string, @Body() dto: UpdateTreeMasterDto) {
    return this.treeMastersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.TREE_MASTERS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Soft-delete Tree Master' })
  remove(@Param('id') id: string) {
    return this.treeMastersService.remove(id);
  }
}
