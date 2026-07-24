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
import { CreateVidhanSabhaDto } from './dto/create-vidhan-sabha.dto';
import { UpdateVidhanSabhaDto } from './dto/update-vidhan-sabha.dto';
import { VidhanSabhaQueryDto } from './dto/vidhan-sabha-query.dto';
import { VidhanSabhasService } from './vidhan-sabhas.service';

@ApiTags('Vidhan Sabhas')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'vidhan-sabhas', version: '1' })
export class VidhanSabhasController {
  constructor(private readonly vidhanSabhasService: VidhanSabhasService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.VIDHAN_SABHAS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new Vidhan Sabha' })
  create(@Body() dto: CreateVidhanSabhaDto) {
    return this.vidhanSabhasService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.VIDHAN_SABHAS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List Vidhan Sabhas (paginated, searchable, sortable)' })
  findAll(@Query() query: VidhanSabhaQueryDto) {
    return this.vidhanSabhasService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.VIDHAN_SABHAS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a Vidhan Sabha by ID' })
  findOne(@Param('id') id: string) {
    return this.vidhanSabhasService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.VIDHAN_SABHAS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a Vidhan Sabha' })
  update(@Param('id') id: string, @Body() dto: UpdateVidhanSabhaDto) {
    return this.vidhanSabhasService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.VIDHAN_SABHAS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a Vidhan Sabha' })
  remove(@Param('id') id: string) {
    return this.vidhanSabhasService.remove(id);
  }
}
