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
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  PermissionAction,
  PermissionResource,
} from '../common/enums/permission.enum';
import { SystemRole } from '../common/enums/role.enum';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateRashiPlantRequestDto } from './dto/create-rashi-plant-request.dto';
import { ReviewRashiPlantRequestDto } from './dto/review-rashi-plant-request.dto';
import { RashiPlantRequestsService } from './rashi-plant-requests.service';

@ApiTags('Rashi Plant Requests')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'rashi-plant-requests', version: '1' })
export class RashiPlantRequestsController {
  constructor(
    private readonly rashiPlantRequestsService: RashiPlantRequestsService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a sacred-tree plantation request from Rashi Van (pending admin review)',
  })
  create(
    @Body() dto: CreateRashiPlantRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rashiPlantRequestsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List sacred-tree plant requests (own by default; admins see all)',
  })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('mine') mine?: string,
  ) {
    return this.rashiPlantRequestsService.findAll(user, { status, mine });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sacred-tree plant request by ID' })
  findOne(@Param('id') id: string) {
    return this.rashiPlantRequestsService.findOne(id);
  }

  @Patch(':id/review')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(
    `${PermissionResource.RASHI_PLANT_REQUESTS}:${PermissionAction.APPROVE}`,
  )
  @ApiOperation({ summary: 'Approve / reject / complete a request (admin)' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewRashiPlantRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rashiPlantRequestsService.review(id, dto, user);
  }
}
