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
import { CreatePersonIdentityDto } from './dto/create-person-identity.dto';
import { PersonIdentityQueryDto } from './dto/person-identity-query.dto';
import { UpdatePersonIdentityDto } from './dto/update-person-identity.dto';
import { PersonIdentityService } from './person-identity.service';
import { VehicleStickerStatus } from './schemas/person-identity.schema';

@ApiTags('Person Identity')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'person-identity', version: '1' })
export class PersonIdentityController {
  constructor(private readonly personIdentityService: PersonIdentityService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(
    `${PermissionResource.PERSON_IDENTITY}:${PermissionAction.CREATE}`,
  )
  @ApiOperation({ summary: 'Create a new person identity card record' })
  create(@Body() dto: CreatePersonIdentityDto) {
    return this.personIdentityService.create(dto);
  }

  @Get()
  @Permissions(
    `${PermissionResource.PERSON_IDENTITY}:${PermissionAction.LIST}`,
  )
  @ApiOperation({
    summary: 'List person identity records (paginated, searchable, sortable)',
  })
  findAll(@Query() query: PersonIdentityQueryDto) {
    return this.personIdentityService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    `${PermissionResource.PERSON_IDENTITY}:${PermissionAction.READ}`,
  )
  @ApiOperation({ summary: 'Get a person identity record by ID' })
  findOne(@Param('id') id: string) {
    return this.personIdentityService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(
    `${PermissionResource.PERSON_IDENTITY}:${PermissionAction.UPDATE}`,
  )
  @ApiOperation({
    summary: 'Update the vehicle sticker generation status of an identity record',
  })
  setVehicleStickerStatus(
    @Param('id') id: string,
    @Body('vehicleStickerStatus') vehicleStickerStatus: VehicleStickerStatus,
  ) {
    return this.personIdentityService.setVehicleStickerStatus(
      id,
      vehicleStickerStatus,
    );
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(
    `${PermissionResource.PERSON_IDENTITY}:${PermissionAction.UPDATE}`,
  )
  @ApiOperation({ summary: 'Update a person identity record by ID' })
  update(@Param('id') id: string, @Body() dto: UpdatePersonIdentityDto) {
    return this.personIdentityService.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(
    `${PermissionResource.PERSON_IDENTITY}:${PermissionAction.DELETE}`,
  )
  @ApiOperation({ summary: 'Soft delete a person identity record by ID' })
  remove(@Param('id') id: string) {
    return this.personIdentityService.remove(id);
  }
}
