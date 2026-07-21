import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandOffersService } from './land-offers.service';
import { LandOffersController } from './land-offers.controller';
import { LandOffer, LandOfferSchema } from './schemas/land-offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandOffer.name, schema: LandOfferSchema },
    ]),
  ],
  controllers: [LandOffersController],
  providers: [LandOffersService],
  exports: [LandOffersService],
})
export class LandOffersModule {}
