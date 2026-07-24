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
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PartnerQueryDto } from './dto/partner-query.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnersService } from './partners.service';

@ApiTags('Partners')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'partners', version: '1' })
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PARTNERS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new channel partner' })
  create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.PARTNERS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List channel partners (paginated, searchable, sortable)' })
  findAll(@Query() query: PartnerQueryDto) {
    return this.partnersService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.PARTNERS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a channel partner by ID' })
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PARTNERS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a channel partner' })
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PARTNERS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a channel partner' })
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
