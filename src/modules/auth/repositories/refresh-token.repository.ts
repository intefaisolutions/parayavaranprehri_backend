import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshTokenDocument> {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {
    super(refreshTokenModel);
  }

  async findByToken(token: string): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel
      .findOne({
        token,
        isRevoked: false,
        isDeleted: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenModel
      .findOneAndUpdate({ token }, { isRevoked: true })
      .exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany({ userId, isRevoked: false }, { isRevoked: true })
      .exec();
  }
}
