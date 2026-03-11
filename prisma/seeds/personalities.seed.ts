import type { PrismaClient } from '@/libs/prisma/client';

const personalities = [
  {
    personality_key: 'JOKER',
    personality_name: 'The Joker',
    personality_desc:
      'Joy through humour, wit, and lightness. Brings laughter and levity to every experience.',
    emoji: '🃏',
    status: 'active',
    accent_color: '#ff8de6',
  },
  {
    personality_key: 'KINESTHETE',
    personality_name: 'The Kinesthete',
    personality_desc:
      'Alive through movement, dance, and physical adventure. Learns best by doing.',
    emoji: '💃',
    status: 'active',
    accent_color: '#86efac',
  },
  {
    personality_key: 'EXPLORER',
    personality_name: 'The Explorer',
    personality_desc:
      'Thrives on discovering new places, ideas, and perspectives. Curiosity-driven.',
    emoji: '🧭',
    status: 'active',
    accent_color: '#fdba74',
  },
  {
    personality_key: 'COMPETITOR',
    personality_name: 'The Competitor',
    personality_desc:
      'Fueled by challenge, rivalry, and the rush of competition. Loves to win.',
    emoji: '🏆',
    status: 'active',
    accent_color: '#f5dd42',
  },
  {
    personality_key: 'COLLECTOR',
    personality_name: 'The Collector',
    personality_desc:
      'Finds joy in gathering, cataloguing, and mastering a domain of interest.',
    emoji: '🏅',
    status: 'active',
    accent_color: '#93c5fd',
  },
  {
    personality_key: 'CREATOR',
    personality_name: 'The Creator',
    personality_desc:
      'Expresses through making — art, music, building, crafting imaginative worlds.',
    emoji: '🎨',
    status: 'active',
    accent_color: '#e9d5ff',
  },
  {
    personality_key: 'DIRECTOR',
    personality_name: 'The Director',
    personality_desc:
      'Loves to organize, lead, and design the experience for others to enjoy.',
    emoji: '🎬',
    status: 'draft',
    accent_color: '#ff8de6',
  },
  {
    personality_key: 'STORYTELLER',
    personality_name: 'The Storyteller',
    personality_desc:
      'Captivates through narrative, roleplay, and imaginative world-building.',
    emoji: '📖',
    status: 'draft',
    accent_color: '#fdba74',
  },
];

export async function seedPersonalities(prisma: PrismaClient): Promise<void> {
  await prisma.personalityType.deleteMany({});
  console.log('🗑️  Cleared existing personality types');

  for (const personality of personalities) {
    await prisma.personalityType.create({ data: personality });
    console.log(`✅ Created personality: ${personality.personality_name}`);
  }
}
