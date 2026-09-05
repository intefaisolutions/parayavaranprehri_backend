import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { LandOffersService } from './land-offers.service';
import { CreateLandOfferDto } from './dto/create-land-offer.dto';
import { UpdateLandOfferDto } from './dto/update-land-offer.dto';
import {
  type JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('land-offers')
@ApiBearerAuth()
@Controller('land-offers')
export class LandOffersController {
  constructor(
    private readonly landOffersService: LandOffersService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(req: Request): string | undefined {
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.decode(token) as JwtPayload;
        if (decoded?.sub) {
          return decoded.sub;
        }
      } catch {
        // Ignore decode error
      }
    }
    return undefined;
  }

  @Public()
  @Post()
  create(
    @Body() createLandOfferDto: CreateLandOfferDto,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.landOffersService.create(createLandOfferDto, userId);
  }

  @Public()
  @Get('me')
  findMine(
    @Req() req: Request,
    @Query('mobile') mobile?: string,
  ) {
    const userId = this.extractUserId(req);
    return this.landOffersService.findMine(userId, mobile);
  }

  @Public()
  @Get()
  findAll() {
    return this.landOffersService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.landOffersService.findOne(id);
  }

  @Public()
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status?: string,
    @Body() dto?: UpdateLandOfferDto,
  ) {
    const finalStatus = status || dto?.status || 'Pending';
    return this.landOffersService.updateStatus(id, finalStatus);
  }

  @Public()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLandOfferDto: UpdateLandOfferDto,
  ) {
    return this.landOffersService.update(id, updateLandOfferDto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.landOffersService.remove(id);
  }
}
