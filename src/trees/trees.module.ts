import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { Tree, TreeSchema } from './schemas/tree.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tree.name, schema: TreeSchema }])],
  controllers: [TreesController],
  providers: [TreesService],
})
export class TreesModule {}
