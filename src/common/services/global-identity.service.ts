import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mitra, MitraDocument } from '../../mitras/schemas/mitra.schema';
import { User, UserDocument } from '../../modules/users/schemas/user.schema';
import { Partner, PartnerDocument } from '../../partners/schemas/partner.schema';
import { Person, PersonDocument } from '../../persons/schemas/person.schema';
import { normalizeEmail, normalizeMobile } from '../utils/identity.util';

export type IdentityKind = 'user' | 'person' | 'mitra' | 'partner';

export interface IdentityExclude {
  userId?: string;
  personId?: string;
  mitraId?: string;
  partnerId?: string;
}

interface IdentityHit {
  kind: IdentityKind;
  id: string;
  mobile?: string;
  email?: string;
  label: string;
}

/**
 * Ensures mobile/email stay unique within each collection, and consistent
 * across User / Person / Mitra (volunteer) / Partner.
 *
 * Same mobile+email may exist on different roles (e.g. User + Person on
 * app register, or User + Mitra for a volunteer). Same collection always
 * conflicts. Cross-role with mismatched email/mobile conflicts.
 */
@Injectable()
export class GlobalIdentityService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    @InjectModel(Mitra.name) private readonly mitraModel: Model<MitraDocument>,
    @InjectModel(Partner.name)
    private readonly partnerModel: Model<PartnerDocument>,
  ) {}

  async assertAvailable(params: {
    as: IdentityKind;
    mobile?: string;
    email?: string;
    exclude?: IdentityExclude;
  }): Promise<void> {
    const mobile = normalizeMobile(params.mobile);
    const email = normalizeEmail(params.email);
    const exclude = params.exclude ?? {};

    if (mobile) {
      await this.assertMobileAvailable(params.as, mobile, email, exclude);
    }
    if (email) {
      await this.assertEmailAvailable(params.as, email, mobile, exclude);
    }
  }

  private async assertMobileAvailable(
    as: IdentityKind,
    mobile: string,
    email: string | undefined,
    exclude: IdentityExclude,
  ) {
    const hits = await this.findByMobile(mobile, exclude);
    for (const hit of hits) {
      if (hit.kind === as) {
        throw new ConflictException(
          `Mobile "${mobile}" is already registered as ${hit.label}`,
        );
      }

      const hitEmail = normalizeEmail(hit.email);
      // Cross-role same person (matching email) is allowed
      if (email && hitEmail && email === hitEmail) continue;

      throw new ConflictException(
        `Mobile "${mobile}" is already registered as ${hit.label}` +
          (hitEmail ? ` (${hitEmail})` : ''),
      );
    }
  }

  private async assertEmailAvailable(
    as: IdentityKind,
    email: string,
    mobile: string | undefined,
    exclude: IdentityExclude,
  ) {
    const hits = await this.findByEmail(email, exclude);
    for (const hit of hits) {
      if (hit.kind === as) {
        throw new ConflictException(
          `Email "${email}" is already registered as ${hit.label}`,
        );
      }

      const hitMobile = normalizeMobile(hit.mobile);
      // Cross-role same person (matching mobile) is allowed
      if (mobile && hitMobile && mobile === hitMobile) continue;

      throw new ConflictException(
        `Email "${email}" is already registered as ${hit.label}` +
          (hitMobile ? ` (${hitMobile})` : ''),
      );
    }
  }

  private async findByMobile(
    mobile: string,
    exclude: IdentityExclude,
  ): Promise<IdentityHit[]> {
    const [users, persons, mitras, partners] = await Promise.all([
      this.userModel
        .find({ phone: mobile, isDeleted: false })
        .select('_id phone email')
        .lean()
        .exec(),
      this.personModel
        .find({ mobile, isDeleted: false })
        .select('_id mobile email name')
        .lean()
        .exec(),
      this.mitraModel
        .find({ mobile, isDeleted: false })
        .select('_id mobile email name')
        .lean()
        .exec(),
      this.partnerModel
        .find({ phone: mobile, isDeleted: false })
        .select('_id phone email partnerName')
        .lean()
        .exec(),
    ]);

    const hits: IdentityHit[] = [];

    for (const u of users) {
      const id = String(u._id);
      if (exclude.userId && id === exclude.userId) continue;
      hits.push({
        kind: 'user',
        id,
        mobile: u.phone,
        email: u.email,
        label: 'User',
      });
    }
    for (const p of persons) {
      const id = String(p._id);
      if (exclude.personId && id === exclude.personId) continue;
      hits.push({
        kind: 'person',
        id,
        mobile: p.mobile,
        email: p.email,
        label: `Person${p.name ? ` (${p.name})` : ''}`,
      });
    }
    for (const m of mitras) {
      const id = String(m._id);
      if (exclude.mitraId && id === exclude.mitraId) continue;
      hits.push({
        kind: 'mitra',
        id,
        mobile: m.mobile,
        email: m.email,
        label: `Mitra / Volunteer${m.name ? ` (${m.name})` : ''}`,
      });
    }
    for (const p of partners) {
      const id = String(p._id);
      if (exclude.partnerId && id === exclude.partnerId) continue;
      hits.push({
        kind: 'partner',
        id,
        mobile: p.phone,
        email: p.email,
        label: `Partner${p.partnerName ? ` (${p.partnerName})` : ''}`,
      });
    }

    return hits;
  }

  private async findByEmail(
    email: string,
    exclude: IdentityExclude,
  ): Promise<IdentityHit[]> {
    const [users, persons, mitras, partners] = await Promise.all([
      this.userModel
        .find({ email, isDeleted: false })
        .select('_id phone email')
        .lean()
        .exec(),
      this.personModel
        .find({ email, isDeleted: false })
        .select('_id mobile email name')
        .lean()
        .exec(),
      this.mitraModel
        .find({ email, isDeleted: false })
        .select('_id mobile email name')
        .lean()
        .exec(),
      this.partnerModel
        .find({ email, isDeleted: false })
        .select('_id phone email partnerName')
        .lean()
        .exec(),
    ]);

    const hits: IdentityHit[] = [];

    for (const u of users) {
      const id = String(u._id);
      if (exclude.userId && id === exclude.userId) continue;
      hits.push({
        kind: 'user',
        id,
        mobile: u.phone,
        email: u.email,
        label: 'User',
      });
    }
    for (const p of persons) {
      const id = String(p._id);
      if (exclude.personId && id === exclude.personId) continue;
      hits.push({
        kind: 'person',
        id,
        mobile: p.mobile,
        email: p.email,
        label: `Person${p.name ? ` (${p.name})` : ''}`,
      });
    }
    for (const m of mitras) {
      const id = String(m._id);
      if (exclude.mitraId && id === exclude.mitraId) continue;
      hits.push({
        kind: 'mitra',
        id,
        mobile: m.mobile,
        email: m.email,
        label: `Mitra / Volunteer${m.name ? ` (${m.name})` : ''}`,
      });
    }
    for (const p of partners) {
      const id = String(p._id);
      if (exclude.partnerId && id === exclude.partnerId) continue;
      hits.push({
        kind: 'partner',
        id,
        mobile: p.phone,
        email: p.email,
        label: `Partner${p.partnerName ? ` (${p.partnerName})` : ''}`,
      });
    }

    return hits;
  }
}
