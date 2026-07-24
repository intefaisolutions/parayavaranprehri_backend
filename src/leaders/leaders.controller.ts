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
import { CreateLeaderDto } from './dto/create-leader.dto';
import { LeaderQueryDto } from './dto/leader-query.dto';
import { UpdateLeaderDto } from './dto/update-leader.dto';
import { LeadersService } from './leaders.service';

@ApiTags('Leaders')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'leaders', version: '1' })
export class LeadersController {
  constructor(private readonly leadersService: LeadersService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LEADERS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new initiative leader' })
  create(@Body() dto: CreateLeaderDto) {
    return this.leadersService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.LEADERS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List initiative leaders (paginated, searchable, sortable)' })
  findAll(@Query() query: LeaderQueryDto) {
    return this.leadersService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.LEADERS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get an initiative leader by ID' })
  findOne(@Param('id') id: string) {
    return this.leadersService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LEADERS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update an initiative leader' })
  update(@Param('id') id: string, @Body() dto: UpdateLeaderDto) {
    return this.leadersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.LEADERS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete an initiative leader' })
  remove(@Param('id') id: string) {
    return this.leadersService.remove(id);
  }
}
