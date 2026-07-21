import {
  ClientSession,
  Document,
  Model,
  QueryFilter,
  SortOrder,
  UpdateQuery,
} from 'mongoose';
import { PaginatedResult } from '../interfaces/api-response.interface';
import {
  MongoFilter,
  PaginationOptions,
} from '../interfaces/pagination.interface';
import { ApiResponseUtil } from '../utils/api-response.util';
import { PaginationUtil } from '../utils/pagination.util';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const entity = new this.model(data);
    return session ? entity.save({ session }) : entity.save();
  }

  async findById(id: string, populate: string[] = []): Promise<T | null> {
    let query = this.model.findOne({
      _id: id,
      isDeleted: false,
    } as QueryFilter<T>);

    populate.forEach((path) => {
      query = query.populate(path);
    });

    return query.exec();
  }

  async findOne(
    filter: QueryFilter<T>,
    populate: string[] = [],
  ): Promise<T | null> {
    let query = this.model.findOne({
      ...filter,
      isDeleted: false,
    } as QueryFilter<T>);

    populate.forEach((path) => {
      query = query.populate(path);
    });

    return query.exec();
  }

  async findPaginated(
    options: PaginationOptions,
    baseFilter: MongoFilter = {},
    searchFields: string[] = [],
    populate: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const searchFilter = PaginationUtil.buildSearchFilter(
      options.search,
      searchFields,
    );
    const filter = PaginationUtil.mergeFilters(
      { isDeleted: false },
      baseFilter,
      searchFilter,
    ) as QueryFilter<T>;

    const skip = PaginationUtil.getSkip(options.page, options.limit);
    const sort = PaginationUtil.buildSort(
      options.sortBy,
      options.sortOrder,
    ) as Record<string, SortOrder>;

    let query = this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(options.limit);

    populate.forEach((path) => {
      query = query.populate(path);
    });

    const [items, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: ApiResponseUtil.buildMeta(options.page, options.limit, total),
    };
  }

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    const query = this.model.findOneAndUpdate(
      { _id: id, isDeleted: false } as QueryFilter<T>,
      data,
      { new: true, session },
    );

    return query.exec();
  }

  async softDelete(id: string, session?: ClientSession): Promise<T | null> {
    return this.updateById(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      } as UpdateQuery<T>,
      session,
    );
  }

  async hardDelete(id: string, session?: ClientSession): Promise<T | null> {
    return this.model.findByIdAndDelete(id, { session }).exec();
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model
      .countDocuments({ ...filter, isDeleted: false } as QueryFilter<T>)
      .exec();
  }
}
