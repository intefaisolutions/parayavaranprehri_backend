import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller({ path: 'leaderboard', version: '1' })
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({
    summary:
      'Live citizen leaderboard (trees → points). Optional scope + period filters.',
  })
  getLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leaderboardService.getLeaderboard(query, user);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Caller rank + stats on the live leaderboard',
  })
  getMyRank(
    @Query() query: LeaderboardQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leaderboardService.getMyRank(query, user);
  }
}
