import {
  Body,
  Controller,
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
import { CreateFieldIssueDto } from './dto/create-field-issue.dto';
import { UpdateFieldIssueStatusDto } from './dto/update-field-issue-status.dto';
import { FieldIssuesService } from './field-issues.service';

@ApiTags('Field Issues')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'field-issues', version: '1' })
export class FieldIssuesController {
  constructor(private readonly fieldIssuesService: FieldIssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Report a field issue' })
  create(
    @Body() dto: CreateFieldIssueDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fieldIssuesService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List field issues (own by default; admins see all)',
  })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('mine') mine?: string,
  ) {
    return this.fieldIssuesService.findAll(user, { status, mine });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a field issue by ID' })
  findOne(@Param('id') id: string) {
    return this.fieldIssuesService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.FIELD_ISSUES}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update field issue status (admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFieldIssueStatusDto,
  ) {
    return this.fieldIssuesService.updateStatus(id, dto);
  }
}
