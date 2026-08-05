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
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonQueryDto } from './dto/person-query.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonsService } from './persons.service';

@ApiTags('Persons')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'persons', version: '1' })
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PERSONS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Admin-register a new person' })
  create(
    @Body() dto: CreatePersonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.personsService.create(dto, user);
  }

  @Post('self-register')
  @ApiOperation({
    summary:
      'App self-registration for a person — auto-checks the insurance system for a matching vehicle policy',
  })
  selfRegister(
    @Body() dto: CreatePersonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.personsService.selfRegister(dto, user);
  }

  @Get()
  @Permissions(`${PermissionResource.PERSONS}:${PermissionAction.LIST}`)
  @ApiOperation({ summary: 'List persons (paginated, searchable, sortable)' })
  findAll(@Query() query: PersonQueryDto) {
    return this.personsService.findAll(query);
  }

  @Get('linked-vehicles')
  @Permissions(`${PermissionResource.VEHICLES}:${PermissionAction.LIST}`)
  @ApiOperation({
    summary:
      'All insurance vehicles linked to persons (admin Vehicle Management)',
  })
  listLinkedVehicles() {
    return this.personsService.listLinkedVehicles();
  }

  @Get('me')
  @ApiOperation({
    summary:
      'Citizen: Person profile linked to the logged-in user (by phone/email)',
  })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.personsService.findMe(user);
  }

  @Get('me/stats')
  @ApiOperation({
    summary:
      'Citizen: aggregates — trees, CO₂ offset, linked vehicles, joined date',
  })
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.personsService.getMyStats(user);
  }

  @Get(':id/vehicles')
  @Permissions(`${PermissionResource.PERSONS}:${PermissionAction.READ}`)
  @ApiOperation({
    summary:
      'Live vehicle + insurance policies for a person (from insurance system by mobile)',
  })
  getVehicles(@Param('id') id: string) {
    return this.personsService.getVehicles(id);
  }

  @Get(':id')
  @Permissions(`${PermissionResource.PERSONS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a person by ID' })
  findOne(@Param('id') id: string) {
    return this.personsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PERSONS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a person by ID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.personsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  @Permissions(`${PermissionResource.PERSONS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Soft delete a person by ID' })
  remove(@Param('id') id: string) {
    return this.personsService.remove(id);
  }
}
