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
import { CallCenterQueryDto } from './dto/call-center-query.dto';
import { CreateCallCenterDto } from './dto/create-call-center.dto';
import { UpdateCallCenterDto } from './dto/update-call-center.dto';
import { CallCenterService } from './call-center.service';

@ApiTags('Call Center')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'call-center', version: '1' })
export class CallCenterController {
  constructor(private readonly callCenterService: CallCenterService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CALL_CENTER}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new call center contact channel' })
  create(@Body() dto: CreateCallCenterDto) {
    return this.callCenterService.create(dto);
  }

  @Get()
  @Permissions(`${PermissionResource.CALL_CENTER}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List call center contacts (paginated, searchable, sortable)' })
  findAll(@Query() query: CallCenterQueryDto) {
    return this.callCenterService.findAll(query);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.CALL_CENTER}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a call center contact by ID' })
  findOne(@Param('id') id: string) {
    return this.callCenterService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CALL_CENTER}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a call center contact' })
  update(@Param('id') id: string, @Body() dto: UpdateCallCenterDto) {
    return this.callCenterService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.CALL_CENTER}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a call center contact' })
  remove(@Param('id') id: string) {
    return this.callCenterService.remove(id);
  }
}
