import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { GreenSelfiesService } from './green-selfies.service';
import { CreateGreenSelfieDto } from './dto/create-green-selfie.dto';
import { UpdateGreenSelfieDto } from './dto/update-green-selfie.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('green-selfies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('green-selfies')
export class GreenSelfiesController {
  constructor(private readonly greenSelfiesService: GreenSelfiesService) {}

  @Post()
  create(@Body() createGreenSelfieDto: CreateGreenSelfieDto, @Request() req: any) {
    return this.greenSelfiesService.create(createGreenSelfieDto, req.user._id);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.greenSelfiesService.findAll(req.user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.greenSelfiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGreenSelfieDto: UpdateGreenSelfieDto) {
    return this.greenSelfiesService.update(id, updateGreenSelfieDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.greenSelfiesService.remove(id);
  }
}
