import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsModule } from '../settings/settings.module';
import { Tree, TreeSchema } from '../trees/schemas/tree.schema';
import { MissionProgressController } from './mission-progress.controller';
import { MissionProgressService } from './mission-progress.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tree.name, schema: TreeSchema }]),
    SettingsModule,
  ],
  controllers: [MissionProgressController],
  providers: [MissionProgressService],
  exports: [MissionProgressService],
})
export class MissionProgressModule {}
