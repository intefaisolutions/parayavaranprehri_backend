import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehicleTreeRulesService } from './vehicle-tree-rules.service';
import { CreateVehicleTreeRuleDto } from './dto/create-vehicle-tree-rule.dto';
import { UpdateVehicleTreeRuleDto } from './dto/update-vehicle-tree-rule.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionResource, PermissionAction } from '../common/enums/permission.enum';

@ApiTags('Vehicle Tree Rules')
@ApiBearerAuth()
@Controller({ path: 'vehicle-tree-rules', version: '1' })
export class VehicleTreeRulesController {
  constructor(private readonly rulesService: VehicleTreeRulesService) {}

  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.CREATE}`)
  @ApiOperation({ summary: 'Create a new vehicle tree rule' })
  @Post()
  create(@Body() dto: CreateVehicleTreeRuleDto) {
    return this.rulesService.create(dto);
  }

  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get all vehicle tree rules' })
  @Get()
  findAll() {
    return this.rulesService.findAll();
  }

  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.READ}`)
  @ApiOperation({ summary: 'Get a vehicle tree rule by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.UPDATE}`)
  @ApiOperation({ summary: 'Update a vehicle tree rule' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleTreeRuleDto) {
    return this.rulesService.update(id, dto);
  }

  @Permissions(`${PermissionResource.SETTINGS}:${PermissionAction.DELETE}`)
  @ApiOperation({ summary: 'Delete a vehicle tree rule' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }
}
