import { PartialType } from '@nestjs/mapped-types';
import { CreateJourneyAchievementDto } from './create-journey-achievement.dto';

export class UpdateJourneyAchievementDto extends PartialType(
  CreateJourneyAchievementDto,
) {}
