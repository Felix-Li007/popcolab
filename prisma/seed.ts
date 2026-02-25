import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/libs/prisma/client';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

// ─── Questions Seed Data ──────────────────────────────────────────────────────

const questions = [
  // ── Single Choice ──────────────────────────────────────────────────────────
  {
    question_type: 'single_choice',
    question_text:
      'When you join a group activity, what role do you naturally take?',
    question_desc: 'Choose the role that best describes your instinct.',
    order_index: 1,
    options: [
      {
        option_label: 'The Entertainer — I keep the mood light',
        option_value: 'entertainer',
        option_score: 1,
      },
      {
        option_label: 'The Organiser — I set rules and structure',
        option_value: 'organiser',
        option_score: 2,
      },
      {
        option_label: 'The Explorer — I push for new ideas',
        option_value: 'explorer',
        option_score: 3,
      },
      {
        option_label: 'The Creator — I build or craft something',
        option_value: 'creator',
        option_score: 4,
      },
    ],
  },
  {
    question_type: 'single_choice',
    question_text: 'What energises you most after a long day at work?',
    question_desc: 'Pick the one that resonates most.',
    order_index: 2,
    options: [
      {
        option_label: 'Physical activity — gym, dance, sport',
        option_value: 'physical',
        option_score: 1,
      },
      {
        option_label: 'Creative expression — drawing, music, writing',
        option_value: 'creative',
        option_score: 2,
      },
      {
        option_label: 'Social fun — games, jokes, shared laughs',
        option_value: 'social',
        option_score: 3,
      },
      {
        option_label: 'Competition — any game with a scoreboard',
        option_value: 'compete',
        option_score: 4,
      },
      {
        option_label: 'Learning — discovering something new',
        option_value: 'learn',
        option_score: 5,
      },
    ],
  },
  {
    question_type: 'single_choice',
    question_text:
      'At a team event, which activity would you secretly be most excited about?',
    question_desc: 'Be honest — no wrong answers!',
    order_index: 3,
    options: [
      {
        option_label: 'An escape room or puzzle challenge',
        option_value: 'puzzle',
        option_score: 1,
      },
      {
        option_label: 'An improv or comedy workshop',
        option_value: 'improv',
        option_score: 2,
      },
      {
        option_label: 'A trivia competition between teams',
        option_value: 'trivia',
        option_score: 3,
      },
      {
        option_label: 'A collaborative mural or craft session',
        option_value: 'craft',
        option_score: 4,
      },
      {
        option_label: 'A dance class or movement session',
        option_value: 'dance',
        option_score: 5,
      },
    ],
  },
  {
    question_type: 'single_choice',
    question_text: 'How do you usually react when you lose at a game?',
    question_desc: 'Select the option that feels most true.',
    order_index: 4,
    options: [
      {
        option_label: 'I brush it off and look for the next challenge',
        option_value: 'resilient',
        option_score: 1,
      },
      {
        option_label: 'I analyse what went wrong and how to improve',
        option_value: 'analytical',
        option_score: 2,
      },
      {
        option_label: 'I make a joke about it to lighten the mood',
        option_value: 'humour',
        option_score: 3,
      },
      {
        option_label: 'I feel genuinely motivated to train harder',
        option_value: 'drive',
        option_score: 4,
      },
    ],
  },

  // ── Multi Choice ───────────────────────────────────────────────────────────
  {
    question_type: 'multi_choice',
    question_text:
      'Which of the following words describe how you play? (Select all that apply)',
    question_desc: 'You can pick more than one.',
    order_index: 5,
    options: [
      {
        option_label: '🧩 Strategic',
        option_value: 'strategic',
        option_score: null,
      },
      {
        option_label: '😂 Playful',
        option_value: 'playful',
        option_score: null,
      },
      { option_label: '🏃 Active', option_value: 'active', option_score: null },
      {
        option_label: '🎨 Creative',
        option_value: 'creative',
        option_score: null,
      },
      {
        option_label: '🔍 Curious',
        option_value: 'curious',
        option_score: null,
      },
      {
        option_label: '🏆 Competitive',
        option_value: 'competitive',
        option_score: null,
      },
    ],
  },
  {
    question_type: 'multi_choice',
    question_text:
      'What types of team-building activities have you genuinely enjoyed in the past?',
    question_desc: 'Select everything that applies.',
    order_index: 6,
    options: [
      {
        option_label: 'Outdoor adventure or sports',
        option_value: 'outdoor',
        option_score: null,
      },
      {
        option_label: 'Creative workshops',
        option_value: 'workshop',
        option_score: null,
      },
      {
        option_label: 'Trivia or quiz nights',
        option_value: 'quiz',
        option_score: null,
      },
      {
        option_label: 'Storytelling or roleplay',
        option_value: 'roleplay',
        option_score: null,
      },
      {
        option_label: 'Hackathons or problem-solving',
        option_value: 'hackathon',
        option_score: null,
      },
    ],
  },
  {
    question_type: 'multi_choice',
    question_text: 'Which situations make you feel most "in your element"?',
    question_desc: 'Pick up to 3 that fit.',
    order_index: 7,
    options: [
      {
        option_label: 'Leading a group through a challenge',
        option_value: 'leading',
        option_score: null,
      },
      {
        option_label: 'Making the whole room laugh',
        option_value: 'laughing',
        option_score: null,
      },
      {
        option_label: 'Discovering a pattern no one else noticed',
        option_value: 'discovery',
        option_score: null,
      },
      {
        option_label: 'Finishing a creative project you started',
        option_value: 'finishing',
        option_score: null,
      },
      {
        option_label: 'Winning a close, hard-fought contest',
        option_value: 'winning',
        option_score: null,
      },
      {
        option_label: 'Moving your body to music or rhythm',
        option_value: 'moving',
        option_score: null,
      },
    ],
  },

  // ── Scale ──────────────────────────────────────────────────────────────────
  {
    question_type: 'scale',
    question_text:
      'How comfortable are you stepping into the spotlight during group activities?',
    question_desc: '1 = very uncomfortable, 5 = absolutely love it.',
    order_index: 8,
    options: [
      {
        option_label: '1 — Prefer to stay behind the scenes',
        option_value: 'min',
        option_score: 1,
      },
      {
        option_label: '5 — Love being centre stage',
        option_value: 'max',
        option_score: 5,
      },
    ],
  },
  {
    question_type: 'scale',
    question_text: 'How important is winning to you when playing a game?',
    question_desc: '1 = just here to have fun, 5 = winning is everything.',
    order_index: 9,
    options: [
      {
        option_label: '1 — Participation is all that matters',
        option_value: 'min',
        option_score: 1,
      },
      {
        option_label: '5 — I play to win',
        option_value: 'max',
        option_score: 5,
      },
    ],
  },
  {
    question_type: 'scale',
    question_text:
      'How often do you find yourself making up stories, games, or scenarios for fun?',
    question_desc: '1 = never, 5 = all the time.',
    order_index: 10,
    options: [
      {
        option_label: '1 — Almost never',
        option_value: 'min',
        option_score: 1,
      },
      {
        option_label: '5 — All the time',
        option_value: 'max',
        option_score: 5,
      },
    ],
  },

  // ── Text Input ─────────────────────────────────────────────────────────────
  {
    question_type: 'text_input',
    question_text:
      'Describe your all-time favourite game or play experience in a few words.',
    question_desc:
      'No right or wrong answer — just tell us what lights you up!',
    order_index: 11,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text: 'What does "play" mean to you personally?',
    question_desc: 'Share your own definition — keep it brief.',
    order_index: 12,
    options: [],
  },
];

// ─── Dimension Seed Data ──────────────────────────────────────────────────────

const dimensionCategories = [
  {
    category_name: 'Play Style',
    category_desc: 'How a person prefers to engage in play activities.',
  },
  {
    category_name: 'Social Orientation',
    category_desc: 'Preferences around group dynamics and leadership.',
  },
  {
    category_name: 'Motivation',
    category_desc: 'Core drives that sustain engagement and enjoyment.',
  },
];

// Indexes defined per category (by category name for easy reference)
const dimensionIndexes = [
  // Play Style
  {
    category: 'Play Style',
    index_key: 'HUMOR',
    index_name: 'Humour Expression',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Play Style',
    index_key: 'KINESIS',
    index_name: 'Physical Activity',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Play Style',
    index_key: 'CREATIVITY',
    index_name: 'Creative Expression',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Play Style',
    index_key: 'STRATEGY',
    index_name: 'Strategic Thinking',
    data_type: 'numeric',
    hard_filter: false,
  },
  // Social Orientation
  {
    category: 'Social Orientation',
    index_key: 'LEADERSHIP',
    index_name: 'Leadership Tendency',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Social Orientation',
    index_key: 'COLLABORATION',
    index_name: 'Team Collaboration',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Social Orientation',
    index_key: 'SPOTLIGHT',
    index_name: 'Spotlight Comfort',
    data_type: 'scale',
    hard_filter: false,
    scale_min: 1,
    scale_max: 5,
  },
  // Motivation
  {
    category: 'Motivation',
    index_key: 'COMPETITION',
    index_name: 'Competitive Drive',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Motivation',
    index_key: 'EXPLORATION',
    index_name: 'Curiosity & Exploration',
    data_type: 'numeric',
    hard_filter: false,
  },
  {
    category: 'Motivation',
    index_key: 'MASTERY',
    index_name: 'Skill Mastery',
    data_type: 'numeric',
    hard_filter: false,
  },
];

// question_dimension mappings: question order_index → [{ indexKey, weight }]
type DimMapping = { indexKey: string; weight: number };
const questionDimensionMappings: Record<number, DimMapping[]> = {
  1: [
    { indexKey: 'LEADERSHIP', weight: 10 },
    { indexKey: 'COLLABORATION', weight: 8 },
  ],
  2: [
    { indexKey: 'KINESIS', weight: 10 },
    { indexKey: 'CREATIVITY', weight: 8 },
    { indexKey: 'HUMOR', weight: 7 },
    { indexKey: 'COMPETITION', weight: 9 },
    { indexKey: 'EXPLORATION', weight: 8 },
  ],
  3: [
    { indexKey: 'STRATEGY', weight: 10 },
    { indexKey: 'HUMOR', weight: 9 },
    { indexKey: 'COMPETITION', weight: 8 },
    { indexKey: 'CREATIVITY', weight: 9 },
    { indexKey: 'KINESIS', weight: 10 },
  ],
  4: [
    { indexKey: 'COMPETITION', weight: 10 },
    { indexKey: 'HUMOR', weight: 8 },
  ],
  5: [
    { indexKey: 'STRATEGY', weight: 7 },
    { indexKey: 'HUMOR', weight: 8 },
    { indexKey: 'KINESIS', weight: 9 },
    { indexKey: 'CREATIVITY', weight: 9 },
    { indexKey: 'EXPLORATION', weight: 8 },
    { indexKey: 'COMPETITION', weight: 7 },
  ],
  6: [
    { indexKey: 'KINESIS', weight: 9 },
    { indexKey: 'CREATIVITY', weight: 8 },
    { indexKey: 'MASTERY', weight: 7 },
    { indexKey: 'EXPLORATION', weight: 8 },
  ],
  7: [
    { indexKey: 'LEADERSHIP', weight: 10 },
    { indexKey: 'HUMOR', weight: 9 },
    { indexKey: 'EXPLORATION', weight: 9 },
    { indexKey: 'CREATIVITY', weight: 9 },
    { indexKey: 'COMPETITION', weight: 10 },
    { indexKey: 'KINESIS', weight: 9 },
  ],
  8: [
    { indexKey: 'SPOTLIGHT', weight: 10 },
    { indexKey: 'LEADERSHIP', weight: 8 },
  ],
  9: [{ indexKey: 'COMPETITION', weight: 10 }],
  10: [
    { indexKey: 'CREATIVITY', weight: 10 },
    { indexKey: 'EXPLORATION', weight: 8 },
  ],
};

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...');

  // ── Personalities ──────────────────────────────────────────────────────────
  await prisma.personalityType.deleteMany({});
  console.log('🗑️  Cleared existing personality types');

  for (const personality of personalities) {
    await prisma.personalityType.create({ data: personality });
    console.log(`✅ Created personality: ${personality.personality_name}`);
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  // Delete in dependency order to avoid FK violations
  await prisma.answer.deleteMany({});
  await prisma.questionDimension.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  console.log('🗑️  Cleared existing questions');

  for (const q of questions) {
    const { options, ...qData } = q;
    await prisma.question.create({
      data: {
        ...qData,
        options: {
          create: options.map(o => ({
            option_label: o.option_label,
            option_value: o.option_value,
            option_score: o.option_score ?? null,
          })),
        },
      },
    });
    console.log(
      `✅ Created question [${qData.question_type}]: ${qData.question_text.slice(0, 50)}…`
    );
  }

  // ── Dimension Categories ───────────────────────────────────────────────────
  await prisma.dimensionIndex.deleteMany({});
  await prisma.dimensionCategory.deleteMany({});
  console.log('🗑️  Cleared existing dimensions');

  const categoryMap = new Map<string, number>();
  for (const cat of dimensionCategories) {
    const created = await prisma.dimensionCategory.create({ data: cat });
    categoryMap.set(cat.category_name, created.id);
    console.log(`✅ Created dimension category: ${cat.category_name}`);
  }

  // ── Dimension Indexes ──────────────────────────────────────────────────────
  const indexKeyMap = new Map<string, number>();
  for (const idx of dimensionIndexes) {
    const categoryId = categoryMap.get(idx.category)!;
    const created = await prisma.dimensionIndex.create({
      data: {
        index_key: idx.index_key,
        index_name: idx.index_name,
        data_type: idx.data_type,
        hard_filter: idx.hard_filter,
        scale_min: (idx as { scale_min?: number }).scale_min ?? null,
        scale_max: (idx as { scale_max?: number }).scale_max ?? null,
        category_id: categoryId,
      },
    });
    indexKeyMap.set(idx.index_key, created.id);
    console.log(`  ✅ [${idx.category}] ${idx.index_name} (${idx.index_key})`);
  }

  // ── Question ↔ Dimension Mappings ─────────────────────────────────────────
  const allQuestions = await prisma.question.findMany({
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
  });
  const questionByOrder = new Map(allQuestions.map(q => [q.order_index, q]));

  for (const [orderIndex, mappings] of Object.entries(
    questionDimensionMappings
  )) {
    const q = questionByOrder.get(Number(orderIndex));
    if (!q) {
      console.warn(`⚠️  No question with order_index ${orderIndex}`);
      continue;
    }
    for (const m of mappings) {
      const dimId = indexKeyMap.get(m.indexKey);
      if (!dimId) {
        console.warn(`⚠️  No dimension with key ${m.indexKey}`);
        continue;
      }
      await prisma.questionDimension.create({
        data: { question_id: q.id, dimension_id: dimId, weight_rate: m.weight },
      });
    }
    console.log(`✅ Wired ${mappings.length} dimension(s) → Q#${orderIndex}`);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch(e => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
