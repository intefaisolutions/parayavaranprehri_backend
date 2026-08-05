import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MissionProgressService } from './mission-progress.service';

@ApiTags('Mission Progress')
@Controller({ path: 'mission-progress', version: '1' })
export class MissionProgressController {
  constructor(
    private readonly missionProgressService: MissionProgressService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Mission 2047 progress % (public). Uses Settings MISSION_2047 + live tree count.',
  })
  getProgress() {
    return this.missionProgressService.getProgress();
  }
}
