import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LanguageRepository } from './repositories/language.repository';
import { Language, LanguageSchema } from './schemas/language.schema';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Language.name, schema: LanguageSchema }]),
  ],
  controllers: [LanguagesController],
  providers: [LanguagesService, LanguageRepository],
  exports: [LanguagesService],
})
export class LanguagesModule {}
