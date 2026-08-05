import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import {
  normalizeEmail,
  normalizeMobile,
} from '../common/utils/identity.util';
import {
  User,
  UserDocument,
} from '../modules/users/schemas/user.schema';
import { oxygenToCo2Kg } from '../common/utils/carbon.util';
import {
  Person,
  PersonDocument,
} from '../persons/schemas/person.schema';
import { Tree, TreeDocument } from '../trees/schemas/tree.schema';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

export type LeaderboardRow = {
  rank: number;
  name: string;
  points: number;
  trees: number;
  co2Kg: number;
  vidhanSabha: string | null;
  badge: string;
  personId: string | null;
  userId: string | null;
  mobile?: string | null;
};

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Tree.name) private readonly treeModel: Model<TreeDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private badgeForPoints(points: number): string {
    if (points >= 500) return 'Forest Champion';
    if (points >= 200) return 'Guardian';
    if (points >= 50) return 'Sapling';
    return 'Seedling';
  }

  private periodStart(period?: 'month' | 'year'): Date | null {
    if (!period) return null;
    const now = new Date();
    if (period === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(now.getFullYear(), 0, 1);
  }

  private async resolveCallerContext(user: JwtPayload): Promise<{
    personId: string | null;
    mobile: string | null;
    city: string | null;
    state: string | null;
    vidhanSabha: string | null;
  }> {
    const account = await this.userModel
      .findById(user.sub)
      .select('phone email')
      .lean()
      .exec();
    const mobile =
      normalizeMobile(account?.phone) ||
      normalizeMobile((user as JwtPayload & { phone?: string }).phone);
    const email =
      normalizeEmail(account?.email) || normalizeEmail(user.email);

    let person: PersonDocument | null = null;
    if (mobile) {
      person = await this.personModel
        .findOne({ mobile, isDeleted: false })
        .exec();
    }
    if (!person && email) {
      person = await this.personModel
        .findOne({
          email: email.toLowerCase().trim(),
          isDeleted: false,
        })
        .exec();
    }

    let vidhanSabha: string | null = null;
    if (person) {
      const [vs] = await this.treeModel
        .aggregate<{ _id: string; n: number }>([
          {
            $match: {
              $or: [
                { personId: person._id },
                ...(mobile ? [{ mobile }] : []),
              ],
              vidhanSabha: { $exists: true, $nin: [null, ''] },
            },
          },
          { $group: { _id: '$vidhanSabha', n: { $sum: 1 } } },
          { $sort: { n: -1 } },
          { $limit: 1 },
        ])
        .exec();
      vidhanSabha = vs?._id ?? null;
    }

    return {
      personId: person ? String(person._id) : null,
      mobile: mobile || null,
      city: person?.city || null,
      state: person?.state || null,
      vidhanSabha,
    };
  }

  private async buildRows(
    query: LeaderboardQueryDto,
    scopeValue?: {
      vidhanSabha?: string | null;
      city?: string | null;
      state?: string | null;
    },
  ): Promise<LeaderboardRow[]> {
    const match: Record<string, unknown> = {};
    const start = this.periodStart(query.period);
    if (start) {
      match.plantedDate = { $gte: start };
    }

    if (query.scope === 'vidhan-sabha' && scopeValue?.vidhanSabha) {
      match.vidhanSabha = scopeValue.vidhanSabha;
    } else if (query.scope === 'city' && scopeValue?.city) {
      match.city = scopeValue.city;
    } else if (query.scope === 'state' && scopeValue?.state) {
      match.state = scopeValue.state;
    } else if (query.scope === 'vidhan-sabha') {
      match.vidhanSabha = { $exists: true, $nin: [null, ''] };
    }

    const grouped = await this.treeModel
      .aggregate<{
        _id: { personId?: Types.ObjectId | null; mobile?: string };
        trees: number;
        totalOxygenKg: number;
        name: string;
        vidhanSabha: string | null;
        mobile: string | null;
        personId: Types.ObjectId | null;
      }>([
        { $match: match },
        {
          $group: {
            _id: {
              personId: '$personId',
              mobile: '$mobile',
            },
            trees: { $sum: 1 },
            totalOxygenKg: {
              $sum: { $ifNull: ['$annualOxygenProductionKg', 0] },
            },
            name: { $first: '$userName' },
            vidhanSabha: { $first: '$vidhanSabha' },
            mobile: { $first: '$mobile' },
            personId: { $first: '$personId' },
          },
        },
        { $sort: { trees: -1, totalOxygenKg: -1 } },
        { $limit: Math.min(query.limit ?? 50, 100) * 3 },
      ])
      .exec();

    // Merge rows that share the same personId OR same mobile
    const merged = new Map<
      string,
      {
        name: string;
        trees: number;
        totalOxygenKg: number;
        vidhanSabha: string | null;
        personId: string | null;
        mobile: string | null;
      }
    >();

    for (const row of grouped) {
      const personKey = row.personId ? `p:${String(row.personId)}` : null;
      const mobileKey = row.mobile
        ? `m:${normalizeMobile(row.mobile) || row.mobile}`
        : null;
      const key = personKey || mobileKey || `anon:${row.name}`;
      const existing = merged.get(key);
      if (existing) {
        existing.trees += row.trees;
        existing.totalOxygenKg += row.totalOxygenKg;
        if (!existing.vidhanSabha && row.vidhanSabha) {
          existing.vidhanSabha = row.vidhanSabha;
        }
      } else {
        merged.set(key, {
          name: row.name || 'Citizen',
          trees: row.trees,
          totalOxygenKg: row.totalOxygenKg,
          vidhanSabha: row.vidhanSabha || null,
          personId: row.personId ? String(row.personId) : null,
          mobile: row.mobile || null,
        });
      }
    }

    // Enrich names from Person master when possible
    const personIds = [...merged.values()]
      .map((r) => r.personId)
      .filter(Boolean) as string[];
    if (personIds.length) {
      const persons = await this.personModel
        .find({
          _id: { $in: personIds.map((id) => new Types.ObjectId(id)) },
          isDeleted: false,
        })
        .select('_id name personId')
        .lean()
        .exec();
      const byId = new Map(persons.map((p) => [String(p._id), p]));
      for (const row of merged.values()) {
        if (row.personId && byId.has(row.personId)) {
          row.name = byId.get(row.personId)!.name || row.name;
        }
      }
    }

    const sorted = [...merged.values()].sort((a, b) => {
      const pa = a.trees * 10 + Math.floor(a.totalOxygenKg);
      const pb = b.trees * 10 + Math.floor(b.totalOxygenKg);
      return pb - pa;
    });

    const limit = Math.min(query.limit ?? 50, 100);
    return sorted.slice(0, limit).map((row, index) => {
      const points = row.trees * 10 + Math.floor(row.totalOxygenKg);
      return {
        rank: index + 1,
        name: row.name,
        points,
        trees: row.trees,
        co2Kg: oxygenToCo2Kg(row.totalOxygenKg),
        vidhanSabha: row.vidhanSabha,
        badge: this.badgeForPoints(points),
        personId: row.personId,
        userId: null,
        mobile: row.mobile,
      };
    });
  }

  async getLeaderboard(
    query: LeaderboardQueryDto,
    user: JwtPayload,
  ): Promise<{ scope?: string; period?: string; items: LeaderboardRow[] }> {
    const ctx = await this.resolveCallerContext(user);
    const items = await this.buildRows(query, ctx);
    return {
      scope: query.scope,
      period: query.period,
      items,
    };
  }

  async getMyRank(
    query: LeaderboardQueryDto,
    user: JwtPayload,
  ): Promise<LeaderboardRow & { totalParticipants: number }> {
    const ctx = await this.resolveCallerContext(user);
    if (!ctx.personId && !ctx.mobile) {
      throw new NotFoundException(
        'No Person profile linked to this account for leaderboard ranking',
      );
    }

    // Build a large board for accurate rank
    const board = await this.buildRows(
      { ...query, limit: 100 },
      ctx,
    );

    const mine = board.find((row) => {
      if (ctx.personId && row.personId === ctx.personId) return true;
      if (
        ctx.mobile &&
        row.mobile &&
        (normalizeMobile(row.mobile) || row.mobile) === ctx.mobile
      ) {
        return true;
      }
      return false;
    });

    if (mine) {
      return { ...mine, totalParticipants: board.length };
    }

    // Not in top board — compute personal stats directly
    const match: Record<string, unknown> = {
      $or: [
        ...(ctx.personId
          ? [{ personId: new Types.ObjectId(ctx.personId) }]
          : []),
        ...(ctx.mobile ? [{ mobile: ctx.mobile }] : []),
      ],
    };
    const start = this.periodStart(query.period);
    if (start) match.plantedDate = { $gte: start };

    const [agg] = await this.treeModel
      .aggregate<{
        trees: number;
        totalOxygenKg: number;
        name: string;
        vidhanSabha: string | null;
      }>([
        { $match: match },
        {
          $group: {
            _id: null,
            trees: { $sum: 1 },
            totalOxygenKg: {
              $sum: { $ifNull: ['$annualOxygenProductionKg', 0] },
            },
            name: { $first: '$userName' },
            vidhanSabha: { $first: '$vidhanSabha' },
          },
        },
      ])
      .exec();

    const trees = agg?.trees ?? 0;
    const totalOxygenKg = agg?.totalOxygenKg ?? 0;
    const points = trees * 10 + Math.floor(totalOxygenKg);

    return {
      rank: board.length + 1,
      name: agg?.name || 'You',
      points,
      trees,
      co2Kg: oxygenToCo2Kg(totalOxygenKg),
      vidhanSabha: agg?.vidhanSabha ?? ctx.vidhanSabha,
      badge: this.badgeForPoints(points),
      personId: ctx.personId,
      userId: user.sub,
      mobile: ctx.mobile,
      totalParticipants: board.length + (trees > 0 ? 1 : 0),
    };
  }
}
