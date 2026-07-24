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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingQueryDto } from './dto/setting-query.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new system setting' })
  create(@Body() dto: CreateSettingDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.create(dto, user);
  }

  @Get()
  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List system settings (paginated, searchable, sortable)' })
  findAll(@Query() query: SettingQueryDto) {
    return this.settingsService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a system setting by ID' })
  findOne(@Param('id') id: string) {
    return this.settingsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a system setting' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a system setting' })
  remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }
}
