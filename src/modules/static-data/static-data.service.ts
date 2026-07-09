import { Injectable } from '@nestjs/common';

@Injectable()
export class StaticDataService {
  getMitraCardData() {
    return {
      name: 'Paryavaran Mitra',
      role: 'Volunteer',
      id: 'PM-2047-001',
      joinedDate: '2023-01-15',
      treesPlanted: 15,
      badges: ['Early Bird', 'Green Thumb'],
    };
  }

  getGamificationData() {
    return {
      leaderboard: [
        { rank: 1, name: 'Aarav Patel', points: 1250, level: 'Green Master' },
        { rank: 2, name: 'Priya Sharma', points: 1100, level: 'Eco Warrior' },
        { rank: 3, name: 'Rohan Gupta', points: 950, level: 'Nature Lover' },
      ],
      userLevel: 'Eco Warrior',
      userPoints: 1100,
      milestones: [
        { title: 'First Tree', achieved: true, date: '2023-02-01' },
        { title: '10 Trees', achieved: true, date: '2023-06-15' },
        { title: '50 Trees', achieved: false, date: null },
      ],
    };
  }

  getRashiVanData() {
    return [
      { rashi: 'Aries (Mesh)', tree: 'Red Sandalwood', benefits: 'Purifies air, brings positivity.' },
      { rashi: 'Taurus (Vrishabha)', tree: 'Saptaparni', benefits: 'Medicinal properties, good for environment.' },
      { rashi: 'Gemini (Mithun)', tree: 'Jackfruit', benefits: 'Provides fruit, broad leaves for shade.' },
      { rashi: 'Cancer (Kark)', tree: 'Palash', benefits: 'Beautiful flowers, useful in ayurveda.' },
      { rashi: 'Leo (Singh)', tree: 'Bael (Wood Apple)', benefits: 'Sacred tree, highly medicinal.' },
      { rashi: 'Virgo (Kanya)', tree: 'Mango', benefits: 'King of fruits, culturally significant.' },
      { rashi: 'Libra (Tula)', tree: 'Bakul', benefits: 'Fragrant flowers, dense shade.' },
      { rashi: 'Scorpio (Vrishchik)', tree: 'Neem', benefits: 'Excellent air purifier, anti-bacterial.' },
      { rashi: 'Sagittarius (Dhanu)', tree: 'Peepal', benefits: 'Releases oxygen 24/7, highly sacred.' },
      { rashi: 'Capricorn (Makar)', tree: 'Shami', benefits: 'Drought resistant, spiritually important.' },
      { rashi: 'Aquarius (Kumbh)', tree: 'Kadamba', benefits: 'Fast growing, beautiful spherical flowers.' },
      { rashi: 'Pisces (Meen)', tree: 'Banyan', benefits: 'Extensive canopy, provides shelter to birds.' },
    ];
  }

  getNewsData() {
    return [
      {
        id: 1,
        title: 'Mission 2047 Launched Successfully',
        date: '2023-08-15',
        content: 'The ambitious Mission 2047 was launched today with a goal to plant 1 billion trees.',
        image: 'https://via.placeholder.com/150',
      },
      {
        id: 2,
        title: 'Community Plantation Drive in Delhi',
        date: '2023-09-02',
        content: 'Over 5000 saplings were planted in a single day by volunteers across the NCR region.',
        image: 'https://via.placeholder.com/150',
      },
      {
        id: 3,
        title: 'New Green Selfies Feature is a Hit!',
        date: '2023-10-10',
        content: 'Users are loving the new feature. Over 10,000 green selfies uploaded this week.',
        image: 'https://via.placeholder.com/150',
      },
    ];
  }

  getInitiativeData() {
    return {
      about: {
        title: 'Mission 2047',
        description: 'Mission 2047 is a visionary initiative aimed at transforming our environment by India\'s 100th year of independence. We aim to restore ecological balance through massive afforestation, community engagement, and leveraging technology for sustainable growth.',
        vision: 'A greener, self-sustaining India by 2047.',
        mission: 'To plant and nurture trees, educate communities, and create a culture of environmental responsibility.',
      },
      support: {
        email: 'support@paryavaranprehri.org',
        phone: '+91-1800-123-4567',
        address: '123 Green Avenue, New Delhi, India 110001',
        faq: [
          { question: 'How can I join?', answer: 'You can register via the app and start participating in local drives.' },
          { question: 'Is it free?', answer: 'Yes, volunteering is completely free.' },
        ],
      },
    };
  }
}
