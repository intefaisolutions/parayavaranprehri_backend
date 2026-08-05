import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../modules/users/users.module';
import { Tree, TreeSchema } from '../trees/schemas/tree.schema';
import { MitrasController } from './mitras.controller';
import { MitrasService } from './mitras.service';
import { Mitra, MitraSchema } from './schemas/mitra.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Mitra.name, schema: MitraSchema },
      { name: Tree.name, schema: TreeSchema },
    ]),
  ],
  controllers: [MitrasController],
  providers: [MitrasService],
  exports: [MitrasService],
})
export class MitrasModule {}
