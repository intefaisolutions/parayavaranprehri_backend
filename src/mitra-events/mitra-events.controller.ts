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
import { CreateMitraEventDto } from './dto/create-mitra-event.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateMitraEventDto } from './dto/update-mitra-event.dto';
import { MitraEventsService } from './mitra-events.service';

@ApiTags('Mitra Events')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'mitra-events', version: '1' })
export class MitraEventsController {
  constructor(private readonly mitraEventsService: MitraEventsService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRA_EVENTS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a Mitra event' })
  create(@Body() dto: CreateMitraEventDto) {
    return this.mitraEventsService.create(dto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'List active events with current Mitra attendance flags',
  })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.mitraEventsService.listMyEventsWithAttendance(user);
  }

  @Get()
  @ApiOperation({ summary: 'List Mitra events' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.mitraEventsService.findAll(includeInactive !== 'true');
  }

  @Get(':id/attendance')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRA_EVENTS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List attendance for an event (admin)' })
  listAttendance(@Param('id') id: string) {
    return this.mitraEventsService.listAttendance(id);
  }

  @Post(':id/attendance')
  @ApiOperation({ summary: 'Mark attendance for an event (Mitra self-service)' })
  markAttendance(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.mitraEventsService.markAttendance(id, user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Mitra event by ID' })
  findOne(@Param('id') id: string) {
    return this.mitraEventsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRA_EVENTS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a Mitra event' })
  update(@Param('id') id: string, @Body() dto: UpdateMitraEventDto) {
    return this.mitraEventsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.MITRA_EVENTS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a Mitra event' })
  remove(@Param('id') id: string) {
    return this.mitraEventsService.remove(id);
  }
}
