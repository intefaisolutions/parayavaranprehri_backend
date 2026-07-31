import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaderRepository } from './repositories/leader.repository';
import { Leader, LeaderDocument } from './schemas/leader.schema';

const SEED_VERSION = 'lovable-v1';

const SEED_LEADERS = [
  {
    leaderName: 'Shri Narendra Modi',
    designation: "Hon'ble Prime Minister of India",
    organization:
      "Mission LiFE — Lifestyle for Environment is India's gift to the world.",
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/2386c033-50ad-4e6a-a05e-8a9a5c495676/modi.jpg',
    displayOrder: 1,
    isActive: true,
  },
  {
    leaderName: 'Dr. Mohan Yadav',
    designation: "Hon'ble Chief Minister, Madhya Pradesh",
    organization: 'A green Madhya Pradesh is a prosperous Madhya Pradesh.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/1a41d7b4-a156-40be-9e18-11abb2b5a581/mohan-yadav.webp',
    displayOrder: 2,
    isActive: true,
  },
  {
    leaderName: 'IAS Manish Singh',
    designation: 'Indian Administrative Service',
    organization: "Governance with green vision builds tomorrow's India.",
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/371ebe86-585f-463a-aa4d-36a799e60c75/manish-singh.png',
    displayOrder: 3,
    isActive: true,
  },
  {
    leaderName: 'Dr. Ram Patidar',
    designation:
      'Environmentalist, Biodiversity Conservationist & Mission Advisor',
    organization: 'Every tree we plant is a promise to the next generation.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/2dfadff4-d848-48cf-bfcf-a65dda7d2bc0/dr-ram-patidar.png',
    displayOrder: 4,
    isActive: true,
  },
  {
    leaderName: 'Shivam Verma',
    designation: 'Collector, Indore',
    organization: 'Every vehicle, every tree — one greener Indore.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/37e90657-3768-41c3-916b-831e696130fa/shivam-verma.jpg',
    displayOrder: 5,
    isActive: true,
  },
  {
    leaderName: 'Siddharth Jain',
    designation: 'Jila Panchayat CEO',
    organization: 'Civic action rooted in nature.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/c74d6f2b-179e-4a1c-ab2f-e2014e11e19e/siddharth-jain.webp',
    displayOrder: 6,
    isActive: true,
  },
  {
    leaderName: 'Kshitij Singhal',
    designation: 'Municipal Corporation',
    organization: 'Cleaner air begins on our streets.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/504bc0c9-58f0-4e28-82f3-5d6fb130e558/kshitij.jpg',
    displayOrder: 7,
    isActive: true,
  },
  {
    leaderName: 'Pradeep Kumar Sharma',
    designation: 'RTO, Indore',
    organization: 'Mobility that gives back to the planet.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/2ec278a8-8b9b-4c5d-ac59-71e6c8457c06/pradeep-sharma.webp',
    displayOrder: 8,
    isActive: true,
  },
  {
    leaderName: 'Pushyamitra Bhargav',
    designation: 'Mayor, Indore',
    organization: 'Pride of Indore — leaf by leaf.',
    photo:
      'https://parayavaranprehri.lovable.app/__l5e/assets-v1/7f73dc40-9f27-4b22-b787-28bdae61952a/pushyamitra.png',
    displayOrder: 9,
    isActive: true,
  },
];

@Injectable()
export class LeadersSeedService implements OnModuleInit {
  private readonly logger = new Logger(LeadersSeedService.name);

  constructor(
    private readonly leaderRepository: LeaderRepository,
    @InjectModel(Leader.name)
    private readonly leaderModel: Model<LeaderDocument>,
  ) {}

  async onModuleInit() {
    const marker = await this.leaderModel
      .findOne({ leaderName: `__seed_${SEED_VERSION}` })
      .lean();

    if (marker) {
      return;
    }

    // Replace previous seed set with Lovable-matched leaders
    await this.leaderModel.deleteMany({});
    for (const leader of SEED_LEADERS) {
      await this.leaderRepository.create(leader as never);
    }
    await this.leaderModel.create({
      leaderName: `__seed_${SEED_VERSION}`,
      designation: 'seed-marker',
      isActive: false,
      displayOrder: 9999,
    });
    this.logger.log(
      `Reseeded ${SEED_LEADERS.length} initiative leaders (${SEED_VERSION})`,
    );
  }
}
