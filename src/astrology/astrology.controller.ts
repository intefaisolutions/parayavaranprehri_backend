import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { AstrologyService } from './astrology.service';
import { CalculateRashiDto } from './dto/calculate-rashi.dto';

@ApiTags('Astrology')
@Controller({ path: 'astrology', version: '1' })
export class AstrologyController {
  constructor(private readonly astrologyService: AstrologyService) {}

  @Post('rashi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate and save Janma Rashi based on birth details' })
  async calculateRashi(@Request() req: any, @Body() dto: CalculateRashiDto) {
    // req.user contains the authenticated user payload
    const userId = req.user.userId || req.user.sub || req.user._id;
    return this.astrologyService.calculateAndSaveRashi(userId, dto);
  }
}
