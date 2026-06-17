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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from './dto/user.dto';
import type {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.USERS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new user' })
  create(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto,
  ) {
    return this.usersService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.USERS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List users with pagination, filter, sort, search' })
  findAll(
    @Query(new ZodValidationPipe(userQuerySchema)) query: UserQueryDto,
  ) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.USERS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.USERS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update user by ID' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.USERS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Soft delete user by ID' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
