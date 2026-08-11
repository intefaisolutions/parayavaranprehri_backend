import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import { Person, PersonSchema } from '../persons/schemas/person.schema';
import { Tree, TreeSchema } from '../trees/schemas/tree.schema';
import {
  VidhanSabha,
  VidhanSabhaSchema,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tree.name, schema: TreeSchema },
      { name: Person.name, schema: PersonSchema },
      { name: User.name, schema: UserSchema },
      { name: VidhanSabha.name, schema: VidhanSabhaSchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
