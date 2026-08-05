import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './repositories/task.repository';
import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskTreeAssignment,
} from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(private readonly taskRepository: TaskRepository) {}

  private normalizeLocationPayload(
    dto: CreateTaskDto | UpdateTaskDto,
  ): Partial<TaskDocument> {
    const patch: Partial<TaskDocument> = {
      ...(dto as unknown as Partial<TaskDocument>),
    };

    if (dto.landId !== undefined) {
      patch.landId =
        dto.landId && Types.ObjectId.isValid(dto.landId)
          ? new Types.ObjectId(dto.landId)
          : null;
    }

    if (dto.treeAssignment !== undefined) {
      patch.treeAssignment = dto.treeAssignment;
    } else if (dto.landId === undefined) {
      // leave as-is on partial update
    } else if (!dto.landId) {
      patch.treeAssignment = TaskTreeAssignment.NONE;
    }

    if (dto.assignedTreeId !== undefined) {
      patch.assignedTreeId =
        dto.assignedTreeId && Types.ObjectId.isValid(dto.assignedTreeId)
          ? new Types.ObjectId(dto.assignedTreeId)
          : null;
    }

    // Strip legacy fields if clients still send them
    delete (patch as Record<string, unknown>).zone;
    delete (patch as Record<string, unknown>).sector;

    return patch;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    return this.taskRepository.create(this.normalizeLocationPayload(dto));
  }

  async findAll(query: TaskQueryDto): Promise<PaginatedResult<Task>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.taskType !== undefined) {
      baseFilter.taskType = query.taskType;
    }
    if (query.priority !== undefined) {
      baseFilter.priority = query.priority;
    }
    if (query.status !== undefined) {
      baseFilter.status = query.status;
    }
    if (query.vidhanSabha !== undefined) {
      baseFilter.vidhanSabha = query.vidhanSabha;
    }

    return this.taskRepository.findPaginated(options, baseFilter, [
      'taskTitle',
      'assignedMitra',
      'state',
      'district',
      'vidhanSabha',
      'landName',
      'assignedTreeName',
    ]);
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const updated = await this.taskRepository.updateById(
      id,
      this.normalizeLocationPayload(dto),
    );
    if (!updated) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return updated;
  }

  async setStatus(id: string, status: TaskStatus): Promise<Task> {
    const updated = await this.taskRepository.updateById(id, {
      status,
    } as Partial<TaskDocument>);
    if (!updated) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.taskRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`Task "${id}" not found`);
    }
  }
}
