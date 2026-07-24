import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Task, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class TaskRepository extends BaseRepository<TaskDocument> {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {
    super(taskModel);
  }
}
