import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { CreatePlantationRequestDto } from './dto/create-plantation-request.dto';
import { PlantationAssignmentQueryDto } from './dto/plantation-assignment-query.dto';
import { SubmitTreeSuggestionDto } from './dto/submit-tree-suggestion.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { PlantationAssignmentsService } from './plantation-assignments.service';

@ApiTags('Plantation Assignments')
@Controller({ path: 'plantation-assignments', version: '1' })
export class PlantationAssignmentsController {
  constructor(
    private readonly assignmentsService: PlantationAssignmentsService,
  ) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary:
      'Initiate/create plantation assignment request for the authenticated user based on dynamic rule',
  })
  createRequest(
    @Body() dto: CreatePlantationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.createRequest(dto, user);
  }

  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({
    summary: 'Citizen: Get all my plantation requests and assignments',
  })
  findMy(@CurrentUser() user: JwtPayload) {
    return this.assignmentsService.findMy(user);
  }

  @ApiBearerAuth()
  @Get()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @ApiOperation({
    summary:
      'Admin: List all plantation requests with assignments, filters and pagination',
  })
  findAllAdmin(@Query() query: PlantationAssignmentQueryDto) {
    return this.assignmentsService.findAllAdmin(query);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary:
      'Get one plantation request with all its tree assignments (owner or admin)',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.assignmentsService.findOne(id, user);
  }

  @ApiBearerAuth()
  @Post(':id/suggestion')
  @ApiOperation({
    summary:
      'Citizen: Submit a preferred tree species for an allowed suggestion slot',
  })
  submitSuggestion(
    @Param('id') id: string,
    @Body() dto: SubmitTreeSuggestionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.submitSuggestion(id, dto, user);
  }

  @ApiBearerAuth()
  @Post(':id/auto-assign')
  @ApiOperation({
    summary:
      'Trigger automatic assignment of remaining required trees from active catalog',
  })
  autoAssignRemaining(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.autoAssignRemaining(id, user);
  }

  @ApiBearerAuth()
  @Patch('assignment/:assignmentId/status')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.MITRA)
  @ApiOperation({
    summary:
      'Admin / Mitra: Update tree assignment status (PLANTED, VERIFIED, ACTIVE, COMPLETED) or assign Mitra',
  })
  updateAssignmentStatus(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.updateAssignmentStatus(
      assignmentId,
      dto,
      user,
    );
  }

  @ApiBearerAuth()
  @Get('assignment/:assignmentId/qr')
  @ApiOperation({
    summary:
      'Generate QR code data URL for a planted tree (owner or admin)',
  })
  generateTreeQr(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignmentsService.generateTreeQr(assignmentId, user);
  }

  @Public()
  @Get('tree/:treeId/public')
  @ApiOperation({
    summary:
      'Public QR scan endpoint: get sanitized public info for a verified tree',
  })
  getPublicTree(@Param('treeId') treeId: string) {
    return this.assignmentsService.getPublicTree(treeId);
  }
}
