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
import { CreateLanguageDto } from './dto/create-language.dto';
import { LanguageQueryDto } from './dto/language-query.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguagesService } from './languages.service';
import { LanguageStatus } from './schemas/language.schema';

@ApiTags('Languages')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'languages', version: '1' })
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANGUAGES}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new Language' })
  create(@Body() dto: CreateLanguageDto) {
    return this.languagesService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.LANGUAGES}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List Languages (paginated, searchable, sortable)' })
  findAll(@Query() query: LanguageQueryDto) {
    return this.languagesService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.LANGUAGES}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a Language by ID' })
  findOne(@Param('id') id: string) {
    return this.languagesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANGUAGES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Set the status of a Language' })
  setStatus(@Param('id') id: string, @Body('status') status: LanguageStatus) {
    return this.languagesService.setStatus(id, status);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANGUAGES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a Language' })
  update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.languagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LANGUAGES}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a Language' })
  remove(@Param('id') id: string) {
    return this.languagesService.remove(id);
  }
}
