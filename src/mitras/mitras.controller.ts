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
import { CreateMitraDto } from './dto/create-mitra.dto';
import { UpdateMitraDto } from './dto/update-mitra.dto';
import { MitrasService } from './mitras.service';

@ApiTags('Mitras')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'mitras', version: '1' })
export class MitrasController {
  constructor(private readonly mitrasService: MitrasService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Register a new Paryavaran Mitra (volunteer)' })
  create(@Body() dto: CreateMitraDto) {
    return this.mitrasService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List Paryavaran Mitras with optional filters' })
  findAll(@Query('status') status?: string, @Query('search') search?: string) {
    return this.mitrasService.findAll({ status, search });
  }

  @Get('mobile/:mobile')
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Find a Mitra by mobile number' })
  findByMobile(@Param('mobile') mobile: string) {
    return this.mitrasService.findByMobile(mobile);
  }

  @Get('code/:mitraId')
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Find a Mitra by Mitra ID (e.g. PM-000001)' })
  findByMitraId(@Param('mitraId') mitraId: string) {
    return this.mitrasService.findByMitraId(mitraId);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a Mitra by ID' })
  findOne(@Param('id') id: string) {
    return this.mitrasService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a Mitra by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateMitraDto) {
    return this.mitrasService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRAS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Soft delete a Mitra by ID' })
  remove(@Param('id') id: string) {
    return this.mitrasService.remove(id);
  }
}
