import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TreeMaster,
  TreeMasterSchema,
} from './schemas/tree-master.schema';
import { TreeMastersController } from './tree-masters.controller';
import { TreeMastersService } from './tree-masters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreeMaster.name, schema: TreeMasterSchema },
    ]),
  ],
  controllers: [TreeMastersController],
  providers: [TreeMastersService],
  exports: [TreeMastersService, MongooseModule],
})
export class TreeMastersModule {}
