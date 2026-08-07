import { ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';

type OrderDoc = { _id: Types.ObjectId; displayOrder?: number };

/**
 * Resolve a unique displayOrder for list entities.
 * - blank / 0 / negative → next max+1
 * - explicit value → must not already be used (unless excludeId)
 */
export async function resolveUniqueDisplayOrder(
  model: Model<OrderDoc>,
  requested: number | undefined | null,
  options: {
    excludeId?: string;
    baseFilter?: Record<string, unknown>;
    label?: string;
  } = {},
): Promise<number> {
  const baseFilter = {
    isDeleted: false,
    ...(options.baseFilter || {}),
  };
  const label = options.label || 'Display order';

  const wantsAuto = requested == null || Number.isNaN(Number(requested)) || Number(requested) <= 0;
  if (wantsAuto) {
    const top = await model
      .findOne(baseFilter)
      .sort({ displayOrder: -1 })
      .select({ displayOrder: 1 })
      .lean()
      .exec();
    return Math.max(0, Number(top?.displayOrder) || 0) + 1;
  }

  const order = Math.floor(Number(requested));
  const conflictFilter: Record<string, unknown> = {
    ...baseFilter,
    displayOrder: order,
  };
  if (options.excludeId) {
    conflictFilter._id = { $ne: options.excludeId };
  }
  const existing = await model.findOne(conflictFilter).select({ _id: 1 }).lean().exec();
  if (existing) {
    throw new ConflictException(
      `${label} ${order} is already used. Choose a unique number, or leave blank to auto-assign.`,
    );
  }
  return order;
}

/**
 * If any duplicates exist, renumber 1..N by current order then createdAt.
 */
export async function resequenceDisplayOrdersIfDuplicated(
  model: Model<OrderDoc>,
  baseFilter: Record<string, unknown> = {},
): Promise<number> {
  const filter = { isDeleted: false, ...baseFilter };
  const items = await model
    .find(filter)
    .sort({ displayOrder: 1, createdAt: 1 })
    .select({ _id: 1, displayOrder: 1 })
    .exec();

  const seen = new Set<number>();
  let hasDup = false;
  for (const item of items) {
    const order = Number(item.displayOrder) || 0;
    if (seen.has(order)) {
      hasDup = true;
      break;
    }
    seen.add(order);
  }
  if (!hasDup) return 0;

  let n = 1;
  let changed = 0;
  for (const item of items) {
    if (item.displayOrder !== n) {
      item.displayOrder = n;
      await item.save();
      changed += 1;
    }
    n += 1;
  }
  return changed;
}
