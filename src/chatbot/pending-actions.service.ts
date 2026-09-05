import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PendingAction,
  PendingActionDocument,
  PendingActionStatus,
} from './schemas/pending-action.schema';

@Injectable()
export class PendingActionsService {
  constructor(
    @InjectModel(PendingAction.name)
    private pendingActionModel: Model<PendingActionDocument>,
  ) {}

  async createPendingAction(
    userId: string,
    sessionId: string,
    actionType: string,
    payload: Record<string, any>,
  ): Promise<PendingAction> {
    // Expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const newAction = new this.pendingActionModel({
      userId,
      sessionId,
      actionType,
      payload,
      status: PendingActionStatus.PENDING,
      expiresAt,
    });
    return newAction.save();
  }

  async getPendingActionById(id: string, userId: string): Promise<PendingActionDocument> {
    const action = await this.pendingActionModel.findOne({ _id: id, userId }).exec();
    if (!action) {
      throw new NotFoundException('Pending action not found');
    }
    return action;
  }

  async getPendingAction(
    userId: string,
    sessionId: string,
    actionType: string,
  ): Promise<PendingAction> {
    const action = await this.pendingActionModel
      .findOne({
        userId,
        sessionId,
        actionType,
        status: PendingActionStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!action) {
      throw new NotFoundException(
        'No active pending action found for this session.',
      );
    }
    return action;
  }

  async markProcessing(id: string): Promise<boolean> {
    const result = await this.pendingActionModel
      .findOneAndUpdate(
        { _id: id, status: PendingActionStatus.PENDING },
        { status: PendingActionStatus.PROCESSING },
        { new: true }
      )
      .exec();
    return !!result;
  }

  async markCompleted(id: string): Promise<void> {
    await this.pendingActionModel
      .updateOne({ _id: id }, { status: PendingActionStatus.COMPLETED })
      .exec();
  }

  async markCancelled(id: string): Promise<void> {
    await this.pendingActionModel
      .updateOne({ _id: id }, { status: PendingActionStatus.CANCELLED })
      .exec();
  }
}
