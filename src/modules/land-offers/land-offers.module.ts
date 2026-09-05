import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { LandOffersService } from './land-offers.service';
import { LandOffersController } from './land-offers.controller';
import { LandOffer, LandOfferSchema } from './schemas/land-offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandOffer.name, schema: LandOfferSchema },
    ]),
    JwtModule,
    UsersModule,
  ],
  controllers: [LandOffersController],
  providers: [LandOffersService],
  exports: [LandOffersService],
})
export class LandOffersModule {}
