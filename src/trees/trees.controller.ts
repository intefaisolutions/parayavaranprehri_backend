import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../common/enums/role.enum';
import { TreesService } from './trees.service';
import { AssignMitraDto } from './dto/assign-mitra.dto';
import { CreateTreeDto } from './dto/create-tree.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';

@ApiTags('Trees')
@Controller({ path: 'trees', version: '1' })
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post()
  create(@Body() createTreeDto: CreateTreeDto) {
    return this.treesService.create(createTreeDto);
  }

  @Get()
  findAll() {
    return this.treesService.findAll();
  }

  @Get('user/:mobile')
  findByUserMobile(@Param('mobile') mobile: string) {
    return this.treesService.findByUserMobile(mobile);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary:
      'Tree analytics: species, height, CO₂/O₂, monthly photos, progress %',
  })
  getAnalytics(@Param('id') id: string) {
    return this.treesService.getAnalytics(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTreeDto: UpdateTreeDto) {
    return this.treesService.update(id, updateTreeDto);
  }

  @Patch(':id/assign-mitra')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN)
  assignMitra(@Param('id') id: string, @Body() dto: AssignMitraDto) {
    return this.treesService.assignMitra(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treesService.remove(id);
  }
}
