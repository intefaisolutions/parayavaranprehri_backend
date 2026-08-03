import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandsModule } from '../lands/lands.module';
import { Mitra, MitraSchema } from '../mitras/schemas/mitra.schema';
import {
  VidhanSabha,
  VidhanSabhaSchema,
} from '../vidhan-sabhas/schemas/vidhan-sabha.schema';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { Tree, TreeSchema } from './schemas/tree.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tree.name, schema: TreeSchema },
      { name: Mitra.name, schema: MitraSchema },
      { name: VidhanSabha.name, schema: VidhanSabhaSchema },
    ]),
    forwardRef(() => LandsModule),
  ],
  controllers: [TreesController],
  providers: [TreesService],
  exports: [TreesService, MongooseModule],
})
export class TreesModule {}
