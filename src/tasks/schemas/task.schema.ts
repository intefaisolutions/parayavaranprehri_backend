import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskType {
  SURVEY = 'Survey',
  PLANTATION = 'Plantation',
  INSPECTION = 'Inspection',
}

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum TaskTreeAssignment {
  NONE = 'NONE',
  ALL = 'ALL',
  SINGLE = 'SINGLE',
}

@Schema({ timestamps: true, collection: 'tasks' })
export class Task extends BaseSchema {
  @Prop({ required: true, trim: true })
  taskTitle!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: TaskType, required: true })
  taskType!: TaskType;

  @Prop({ trim: true })
  assignedMitra?: string;

  @Prop({ trim: true, index: true })
  state?: string;

  @Prop({ trim: true, index: true })
  district?: string;

  @Prop({ trim: true, index: true })
  vidhanSabha?: string;

  @Prop({ type: Types.ObjectId, ref: 'Land', default: null })
  landId?: Types.ObjectId | null;

  @Prop({ trim: true })
  landName?: string;

  @Prop({
    enum: TaskTreeAssignment,
    default: TaskTreeAssignment.NONE,
  })
  treeAssignment!: TaskTreeAssignment;

  @Prop({ type: Types.ObjectId, ref: 'Tree', default: null })
  assignedTreeId?: Types.ObjectId | null;

  @Prop({ trim: true })
  assignedTreeName?: string;

  @Prop({ type: Date, required: true })
  dueDate!: Date;

  @Prop({ enum: TaskPriority, default: TaskPriority.MEDIUM, index: true })
  priority!: TaskPriority;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING, index: true })
  status!: TaskStatus;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({
  taskTitle: 'text',
  assignedMitra: 'text',
  state: 'text',
  district: 'text',
  vidhanSabha: 'text',
  landName: 'text',
  assignedTreeName: 'text',
});
