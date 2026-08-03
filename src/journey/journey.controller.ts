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
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateJourneyAchievementDto } from './dto/create-journey-achievement.dto';
import { UpdateJourneyAchievementDto } from './dto/update-journey-achievement.dto';
import { UpdateJourneyProfileDto } from './dto/update-journey-profile.dto';
import { JourneyService } from './journey.service';

@ApiTags('Journey')
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'journey', version: '1' })
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Public journey timeline (profile + achievements for the app)',
  })
  getTimeline() {
    return this.journeyService.getPublicTimeline();
  }

  @Get('achievements')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List journey achievements (admin)' })
  listAchievements(@Query('includeInactive') includeInactive?: string) {
    return this.journeyService.listAchievements(includeInactive === 'true');
  }

  @Post('achievements')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a journey achievement' })
  createAchievement(@Body() dto: CreateJourneyAchievementDto) {
    return this.journeyService.createAchievement(dto);
  }

  @Get('achievements/:id')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a journey achievement by ID' })
  findAchievement(@Param('id') id: string) {
    return this.journeyService.findAchievement(id);
  }

  @Patch('achievements/:id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a journey achievement' })
  updateAchievement(
    @Param('id') id: string,
    @Body() dto: UpdateJourneyAchievementDto,
  ) {
    return this.journeyService.updateAchievement(id, dto);
  }

  @Delete('achievements/:id')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a journey achievement' })
  removeAchievement(@Param('id') id: string) {
    return this.journeyService.removeAchievement(id);
  }

  @Get('profile')
  @ApiBearerAuth()
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get journey profile (admin)' })
  getProfile() {
    return this.journeyService.getOrCreateProfile();
  }

  @Patch('profile')
  @ApiBearerAuth()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.JOURNEY}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update journey profile (admin)' })
  updateProfile(@Body() dto: UpdateJourneyProfileDto) {
    return this.journeyService.updateProfile(dto);
  }
}
