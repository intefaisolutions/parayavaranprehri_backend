import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadersSeedService } from './leaders-seed.service';
import { LeaderRepository } from './repositories/leader.repository';
import { LeadersController } from './leaders.controller';
import { LeadersService } from './leaders.service';
import { Leader, LeaderSchema } from './schemas/leader.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Leader.name, schema: LeaderSchema }]),
  ],
  controllers: [LeadersController],
  providers: [LeadersService, LeaderRepository, LeadersSeedService],
  exports: [LeadersService],
})
export class LeadersModule {}
