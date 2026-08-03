import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JourneyController } from './journey.controller';
import { JourneyService } from './journey.service';
import {
  JourneyAchievement,
  JourneyAchievementSchema,
} from './schemas/journey-achievement.schema';
import {
  JourneyProfile,
  JourneyProfileSchema,
} from './schemas/journey-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JourneyAchievement.name, schema: JourneyAchievementSchema },
      { name: JourneyProfile.name, schema: JourneyProfileSchema },
    ]),
  ],
  controllers: [JourneyController],
  providers: [JourneyService],
  exports: [JourneyService],
})
export class JourneyModule {}
