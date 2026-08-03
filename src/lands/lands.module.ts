import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tree, TreeSchema } from '../trees/schemas/tree.schema';
import {
  VidhanSabha,
  VidhanSabhaSchema,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { LandsController } from './lands.controller';
import { LandsService } from './lands.service';
import { Land, LandSchema } from './schemas/land.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Land.name, schema: LandSchema },
      { name: Tree.name, schema: TreeSchema },
      { name: VidhanSabha.name, schema: VidhanSabhaSchema },
    ]),
  ],
  controllers: [LandsController],
  providers: [LandsService],
  exports: [LandsService, MongooseModule],
})
export class LandsModule {}
