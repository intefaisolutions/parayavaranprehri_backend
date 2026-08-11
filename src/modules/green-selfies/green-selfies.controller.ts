import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GreenSelfiesService } from './green-selfies.service';
import { CreateGreenSelfieDto } from './dto/create-green-selfie.dto';
import { UpdateGreenSelfieDto } from './dto/update-green-selfie.dto';
import {
  CurrentUser,
  type JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('green-selfies')
@ApiBearerAuth()
@Controller('green-selfies')
export class GreenSelfiesController {
  constructor(private readonly greenSelfiesService: GreenSelfiesService) {}

  @Post()
  create(
    @Body() createGreenSelfieDto: CreateGreenSelfieDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.greenSelfiesService.create(createGreenSelfieDto, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.greenSelfiesService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.greenSelfiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGreenSelfieDto: UpdateGreenSelfieDto,
  ) {
    return this.greenSelfiesService.update(id, updateGreenSelfieDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.greenSelfiesService.remove(id);
  }
}
