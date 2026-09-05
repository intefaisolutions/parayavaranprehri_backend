import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptVideoController } from './concept-video.controller';
import { ConceptVideoService } from './concept-video.service';
import {
  ConceptVideo,
  ConceptVideoSchema,
} from './schemas/concept-video.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConceptVideo.name, schema: ConceptVideoSchema },
    ]),
  ],
  controllers: [ConceptVideoController],
  providers: [ConceptVideoService],
  exports: [ConceptVideoService],
})
export class ConceptVideoModule {}
