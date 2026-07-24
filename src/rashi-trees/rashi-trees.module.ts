import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RashiTreeRepository } from './repositories/rashi-tree.repository';
import { RashiTreesController } from './rashi-trees.controller';
import { RashiTreesService } from './rashi-trees.service';
import { RashiTree, RashiTreeSchema } from './schemas/rashi-tree.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RashiTree.name, schema: RashiTreeSchema },
    ]),
  ],
  controllers: [RashiTreesController],
  providers: [RashiTreesService, RashiTreeRepository],
  exports: [RashiTreesService],
})
export class RashiTreesModule {}
