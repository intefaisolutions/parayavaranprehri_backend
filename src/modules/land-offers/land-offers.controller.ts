import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LandOffersService } from './land-offers.service';
import { CreateLandOfferDto } from './dto/create-land-offer.dto';
import { UpdateLandOfferDto } from './dto/update-land-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('land-offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('land-offers')
export class LandOffersController {
  constructor(private readonly landOffersService: LandOffersService) {}

  @Post()
  create(@Body() createLandOfferDto: CreateLandOfferDto, @Request() req: any) {
    return this.landOffersService.create(createLandOfferDto, req.user._id);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.landOffersService.findAll(req.user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.landOffersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLandOfferDto: UpdateLandOfferDto,
  ) {
    return this.landOffersService.update(id, updateLandOfferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.landOffersService.remove(id);
  }
}
