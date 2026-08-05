import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  TaskPriority,
  TaskStatus,
  TaskTreeAssignment,
  TaskType,
} from '../schemas/task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  taskTitle!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsNotEmpty()
  taskType!: TaskType;

  @IsString()
  @IsOptional()
  assignedMitra?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  vidhanSabha?: string;

  @IsString()
  @IsOptional()
  landId?: string;

  @IsString()
  @IsOptional()
  landName?: string;

  @IsEnum(TaskTreeAssignment)
  @IsOptional()
  treeAssignment?: TaskTreeAssignment;

  @IsString()
  @IsOptional()
  assignedTreeId?: string;

  @IsString()
  @IsOptional()
  assignedTreeName?: string;

  @Type(() => String)
  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
