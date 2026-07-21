import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TreesService } from './trees.service';
import { CreateTreeDto } from './dto/create-tree.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';

@Controller('trees')
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTreeDto: UpdateTreeDto) {
    return this.treesService.update(id, updateTreeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treesService.remove(id);
  }
}
