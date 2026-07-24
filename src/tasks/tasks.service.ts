import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskRepository } from './repositories/task.repository';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    return this.taskRepository.create(dto as unknown as Partial<TaskDocument>);
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
      'vidhanSabha',
      'zone',
      'sector',
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
      dto as unknown as Partial<TaskDocument>,
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
