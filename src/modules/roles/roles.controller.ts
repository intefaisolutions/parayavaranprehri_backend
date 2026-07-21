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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../../common/enums/permission.enum';
import { SystemRole } from '../../common/enums/role.enum';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createRoleSchema,
  roleQuerySchema,
  updateRoleSchema,
} from './dto/role.dto';
import type {
  CreateRoleDto,
  RoleQueryDto,
  UpdateRoleDto,
} from './dto/role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller({ path: 'roles', version: '1' })
@UseGuards(RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.ROLES}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body(new ZodValidationPipe(createRoleSchema)) dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.ROLES}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List all roles with pagination' })
  findAll(@Query(new ZodValidationPipe(roleQuerySchema)) query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.ROLES}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.ROLES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update role by ID' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN)
  @Permissions(`${PermissionResource.ROLES}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Soft delete role by ID' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller({ path: 'permissions', version: '1' })
@UseGuards(RolesGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions(`${PermissionResource.PERMISSIONS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List all permissions' })
  findAll(@Query(new ZodValidationPipe(roleQuerySchema)) query: RoleQueryDto) {
    return this.rolesService.findAllPermissions(query);
  }
}
