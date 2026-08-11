import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LandOffersService } from './land-offers.service';
import { CreateLandOfferDto } from './dto/create-land-offer.dto';
import { UpdateLandOfferDto } from './dto/update-land-offer.dto';
import {
  CurrentUser,
  type JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('land-offers')
@ApiBearerAuth()
@Controller('land-offers')
export class LandOffersController {
  constructor(private readonly landOffersService: LandOffersService) {}

  @Post()
  create(
    @Body() createLandOfferDto: CreateLandOfferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.landOffersService.create(createLandOfferDto, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.landOffersService.findAll(user.sub);
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
