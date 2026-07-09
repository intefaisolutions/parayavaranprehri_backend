import { Controller, Get } from '@nestjs/common';
import { StaticDataService } from './static-data.service';

@Controller('static-data')
export class StaticDataController {
  constructor(private readonly staticDataService: StaticDataService) {}

  @Get('mitra-card')
  getMitraCardData() {
    return this.staticDataService.getMitraCardData();
  }

  @Get('gamification')
  getGamificationData() {
    return this.staticDataService.getGamificationData();
  }

  @Get('rashi-van')
  getRashiVanData() {
    return this.staticDataService.getRashiVanData();
  }

  @Get('news')
  getNewsData() {
    return this.staticDataService.getNewsData();
  }

  @Get('initiative-info')
  getInitiativeData() {
    return this.staticDataService.getInitiativeData();
  }
}
