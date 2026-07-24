import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/interfaces/api-response.interface';
import { PaginationUtil } from '../common/utils/pagination.util';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsRepository } from './repositories/news.repository';
import { News, NewsDocument } from './schemas/news.schema';

@Injectable()
export class NewsService {
  constructor(private readonly newsRepository: NewsRepository) {}

  async create(dto: CreateNewsDto): Promise<News> {
    return this.newsRepository.create(dto as Partial<NewsDocument>);
  }

  async findAll(query: NewsQueryDto): Promise<PaginatedResult<News>> {
    const options = PaginationUtil.parse(query);
    const baseFilter: Record<string, unknown> = {};
    if (query.category) {
      baseFilter.category = query.category;
    }
    if (query.status) {
      baseFilter.status = query.status;
    }

    return this.newsRepository.findPaginated(options, baseFilter, [
      'title',
      'content',
      'author',
    ]);
  }

  async findOne(id: string): Promise<News> {
    const entry = await this.newsRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`News article "${id}" not found`);
    }
    return entry;
  }

  async update(id: string, dto: UpdateNewsDto): Promise<News> {
    const updated = await this.newsRepository.updateById(
      id,
      dto as Partial<NewsDocument>,
    );
    if (!updated) {
      throw new NotFoundException(`News article "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const removed = await this.newsRepository.softDelete(id);
    if (!removed) {
      throw new NotFoundException(`News article "${id}" not found`);
    }
  }
}
