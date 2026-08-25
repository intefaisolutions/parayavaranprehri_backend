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
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './schemas/task.schema';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'tasks', version: '1' })
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.TASKS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tasks assigned to me' })
  findMine(@CurrentUser() user: any, @Query() query: TaskQueryDto) {
    return this.tasksService.findAll({ ...query, assignedMitra: query.assignedMitra || user.userId || user.sub } as any);
  }

  @Get()
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.TASKS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List tasks (paginated, searchable, sortable)' })
  findAll(@Query() query: TaskQueryDto) {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.TASKS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Public()
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the status of a task' })
  setStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @Body('proofDescription') proofDescription?: string,
    @Body('proofMediaUrl') proofMediaUrl?: string,
  ) {
    return this.tasksService.setStatus(id, status, proofDescription, proofMediaUrl);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.TASKS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.TASKS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
