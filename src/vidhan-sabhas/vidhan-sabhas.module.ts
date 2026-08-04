import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandsModule } from '../lands/lands.module';
import {
  Plantation,
  PlantationSchema,
} from '../plantations/schemas/plantation.schema';
import { Tree, TreeSchema } from '../trees/schemas/tree.schema';
import { VidhanSabhaRepository } from './repositories/vidhan-sabha.repository';
import {
  VidhanSabha,
  VidhanSabhaSchema,
} from './schemas/vidhan-sabha.schema';
import { VidhanSabhasController } from './vidhan-sabhas.controller';
import { VidhanSabhasService } from './vidhan-sabhas.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VidhanSabha.name, schema: VidhanSabhaSchema },
      { name: Tree.name, schema: TreeSchema },
      { name: Plantation.name, schema: PlantationSchema },
    ]),
    LandsModule,
  ],
  controllers: [VidhanSabhasController],
  providers: [VidhanSabhasService, VidhanSabhaRepository],
  exports: [VidhanSabhasService],
})
export class VidhanSabhasModule {}
