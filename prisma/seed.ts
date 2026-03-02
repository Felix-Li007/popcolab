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

type DimensionOptionSeed = {
  index_key: string;
  allowed_values: string[];
};

const dimensionOptions: DimensionOptionSeed[] = [
  {
    index_key: 'HUMOR',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'KINESIS',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'CREATIVITY',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'STRATEGY',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'LEADERSHIP',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'COLLABORATION',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'SPOTLIGHT',
    allowed_values: ['1', '2', '3', '4', '5'],
  },
  {
    index_key: 'COMPETITION',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'EXPLORATION',
    allowed_values: ['low', 'medium', 'high'],
  },
  {
    index_key: 'MASTERY',
    allowed_values: ['low', 'medium', 'high'],
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

type MockRequestPreferenceSeed = {
  index_key: string;
  desired_score: number;
  weight_rate: number;
};

type MockRequestSeed = {
  objective_category?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  delivery_method?: number | null;
  duration_max?: number | null;
  preferences?: MockRequestPreferenceSeed[];
};

type MockProfileSeed = {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  preferred_contact?: string | null;
  consent_given: number;
  privacy_notes?: string | null;
};

type MockCompanySeed = {
  corporate_name?: string | null;
  department_name?: string | null;
  role_title?: string | null;
  work_mode?: string | null;
};

type MockUserSeed = {
  email: string;
  status: 'active' | 'inactive';
  profile?: MockProfileSeed;
  company?: MockCompanySeed;
  requests?: MockRequestSeed[];
};

type MockTeamSeed = {
  team_name: string;
  team_code: string;
  team_notes?: string;
  created_by_email: string;
  members: string[];
};

const USER_NAME_MAX_LENGTH = 50;

function normalizeUserName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '')
    .replace(/[_\-.]{2,}/g, '_');

  return normalized.slice(0, USER_NAME_MAX_LENGTH);
}

function deriveUserName(seedUser: MockUserSeed): string {
  const first = seedUser.profile?.first_name?.trim();
  const last = seedUser.profile?.last_name?.trim();

  if (first && last) {
    const joined = normalizeUserName(`${first}.${last}`);
    if (joined) return joined;
  }

  if (first) {
    const fromFirst = normalizeUserName(first);
    if (fromFirst) return fromFirst;
  }

  const localPart = seedUser.email.split('@')[0] ?? '';
  const fromEmail = normalizeUserName(localPart);
  if (fromEmail) return fromEmail;

  return 'user';
}

const mockUsers: MockUserSeed[] = [
  {
    email: 'ava.hughes@northstar.io',
    status: 'active',
    profile: {
      first_name: 'Ava',
      last_name: 'Hughes',
      phone_number: '+1-415-555-1001',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Weekly updates preferred.',
    },
    company: {
      corporate_name: 'Northstar Labs',
      department_name: 'Product',
      role_title: 'Product Manager',
      work_mode: 'hybrid',
    },
    requests: [
      {
        objective_category: 1,
        budget_min: 3000,
        budget_max: 6000,
        delivery_method: 1,
        duration_max: 180,
        preferences: [
          { index_key: 'COLLABORATION', desired_score: 80, weight_rate: 35 },
          { index_key: 'CREATIVITY', desired_score: 75, weight_rate: 30 },
          { index_key: 'LEADERSHIP', desired_score: 70, weight_rate: 20 },
        ],
      },
      {
        objective_category: 2,
        budget_min: 2000,
        budget_max: 4500,
        delivery_method: 2,
        duration_max: 120,
        preferences: [
          { index_key: 'HUMOR', desired_score: 85, weight_rate: 40 },
          { index_key: 'SPOTLIGHT', desired_score: 65, weight_rate: 25 },
        ],
      },
    ],
  },
  {
    email: 'logan.chen@northstar.io',
    status: 'active',
    profile: {
      first_name: 'Logan',
      last_name: 'Chen',
      phone_number: '+1-415-555-1002',
      preferred_contact: 'phone',
      consent_given: 1,
      privacy_notes: 'Phone for urgent coordination.',
    },
    company: {
      corporate_name: 'Northstar Labs',
      department_name: 'Operations',
      role_title: 'Ops Lead',
      work_mode: 'onsite',
    },
    requests: [
      {
        objective_category: 3,
        budget_min: 5000,
        budget_max: 9000,
        delivery_method: 1,
        duration_max: 240,
        preferences: [
          { index_key: 'STRATEGY', desired_score: 90, weight_rate: 45 },
          { index_key: 'COMPETITION', desired_score: 78, weight_rate: 25 },
        ],
      },
    ],
  },
  {
    email: 'mia.garcia@lumen.co',
    status: 'active',
    profile: {
      first_name: 'Mia',
      last_name: 'Garcia',
      phone_number: '+1-650-555-1003',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Creative workshops enthusiast.',
    },
    company: {
      corporate_name: 'Lumen Co',
      department_name: 'Design',
      role_title: 'Design Director',
      work_mode: 'hybrid',
    },
    requests: [
      {
        objective_category: 1,
        budget_min: 2500,
        budget_max: 5000,
        delivery_method: 2,
        duration_max: 150,
        preferences: [
          { index_key: 'CREATIVITY', desired_score: 92, weight_rate: 50 },
          { index_key: 'EXPLORATION', desired_score: 76, weight_rate: 20 },
        ],
      },
    ],
  },
  {
    email: 'ethan.park@lumen.co',
    status: 'inactive',
    profile: {
      first_name: 'Ethan',
      last_name: 'Park',
      phone_number: '+1-650-555-1004',
      preferred_contact: 'email',
      consent_given: 0,
      privacy_notes: 'Paused account during leave.',
    },
    company: {
      corporate_name: 'Lumen Co',
      department_name: 'Engineering',
      role_title: 'Frontend Engineer',
      work_mode: 'remote',
    },
  },
  {
    email: 'sophia.reed@helix.ai',
    status: 'active',
    profile: {
      first_name: 'Sophia',
      last_name: 'Reed',
      phone_number: '+1-206-555-1005',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Interested in active sessions.',
    },
    company: {
      corporate_name: 'Helix AI',
      department_name: 'People Ops',
      role_title: 'HRBP',
      work_mode: 'hybrid',
    },
    requests: [
      {
        objective_category: 4,
        budget_min: 1500,
        budget_max: 3500,
        delivery_method: 1,
        duration_max: 90,
        preferences: [
          { index_key: 'KINESIS', desired_score: 82, weight_rate: 35 },
          { index_key: 'COLLABORATION', desired_score: 88, weight_rate: 30 },
        ],
      },
    ],
  },
  {
    email: 'noah.wright@helix.ai',
    status: 'inactive',
    profile: {
      first_name: 'Noah',
      last_name: 'Wright',
      phone_number: '+1-206-555-1006',
      preferred_contact: 'phone',
      consent_given: 0,
      privacy_notes: 'Reactivate next quarter.',
    },
    company: {
      corporate_name: 'Helix AI',
      department_name: 'Security',
      role_title: 'Security Analyst',
      work_mode: 'onsite',
    },
    requests: [
      {
        objective_category: 2,
        budget_min: 1800,
        budget_max: 4200,
        delivery_method: 2,
        duration_max: 110,
        preferences: [
          { index_key: 'MASTERY', desired_score: 84, weight_rate: 35 },
          { index_key: 'STRATEGY', desired_score: 79, weight_rate: 25 },
        ],
      },
    ],
  },
  {
    email: 'olivia.kim@verve.studio',
    status: 'active',
    profile: {
      first_name: 'Olivia',
      last_name: 'Kim',
      phone_number: '+1-408-555-1007',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: null,
    },
    company: {
      corporate_name: 'Verve Studio',
      department_name: 'Marketing',
      role_title: 'Brand Strategist',
      work_mode: 'remote',
    },
  },
  {
    email: 'liam.brown@verve.studio',
    status: 'active',
    profile: {
      first_name: 'Liam',
      last_name: 'Brown',
      phone_number: '+1-408-555-1008',
      preferred_contact: 'phone',
      consent_given: 1,
      privacy_notes: 'Prefers evening sessions.',
    },
    company: {
      corporate_name: 'Verve Studio',
      department_name: 'Growth',
      role_title: 'Growth Manager',
      work_mode: 'hybrid',
    },
    requests: [
      {
        objective_category: 3,
        budget_min: 2200,
        budget_max: 5400,
        delivery_method: 1,
        duration_max: 140,
        preferences: [
          { index_key: 'COMPETITION', desired_score: 86, weight_rate: 35 },
          { index_key: 'HUMOR', desired_score: 74, weight_rate: 20 },
        ],
      },
    ],
  },
  {
    email: 'emma.davis@orbit.one',
    status: 'active',
    profile: {
      first_name: 'Emma',
      last_name: 'Davis',
      phone_number: '+1-312-555-1009',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Looking for mixed-format events.',
    },
    company: {
      corporate_name: 'Orbit One',
      department_name: 'Finance',
      role_title: 'Finance Manager',
      work_mode: 'onsite',
    },
    requests: [
      {
        objective_category: 1,
        budget_min: 3200,
        budget_max: 7000,
        delivery_method: 1,
        duration_max: 200,
        preferences: [
          { index_key: 'LEADERSHIP', desired_score: 81, weight_rate: 30 },
          { index_key: 'COLLABORATION', desired_score: 89, weight_rate: 35 },
        ],
      },
    ],
  },
  {
    email: 'mason.lee@orbit.one',
    status: 'inactive',
    profile: {
      first_name: 'Mason',
      last_name: 'Lee',
      phone_number: '+1-312-555-1010',
      preferred_contact: 'email',
      consent_given: 0,
      privacy_notes: 'No outreach while inactive.',
    },
    company: {
      corporate_name: 'Orbit One',
      department_name: 'Data',
      role_title: 'Data Analyst',
      work_mode: 'remote',
    },
  },
  {
    email: 'harper.nguyen@aurora.dev',
    status: 'active',
    profile: {
      first_name: 'Harper',
      last_name: 'Nguyen',
      phone_number: '+1-971-555-1011',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Prefers low-noise activities.',
    },
    requests: [
      {
        objective_category: 4,
        budget_min: 1200,
        budget_max: 2600,
        delivery_method: 2,
        duration_max: 80,
        preferences: [
          { index_key: 'EXPLORATION', desired_score: 83, weight_rate: 32 },
          { index_key: 'CREATIVITY', desired_score: 80, weight_rate: 28 },
        ],
      },
    ],
  },
  {
    email: 'jack.wilson@example.com',
    status: 'active',
    profile: {
      first_name: 'Jack',
      last_name: 'Wilson',
      phone_number: '+1-503-555-1012',
      preferred_contact: 'phone',
      consent_given: 1,
      privacy_notes: null,
    },
  },
];

const mockTeams: MockTeamSeed[] = [
  {
    team_name: 'Trailblazers',
    team_code: 'TRAIL-01',
    team_notes: 'Cross-functional pilots',
    created_by_email: 'ava.hughes@northstar.io',
    members: [
      'logan.chen@northstar.io',
      'mia.garcia@lumen.co',
      'sophia.reed@helix.ai',
    ],
  },
  {
    team_name: 'Insight Ops',
    team_code: 'INSIGHT-02',
    team_notes: 'Metrics and planning circle',
    created_by_email: 'logan.chen@northstar.io',
    members: [
      'ava.hughes@northstar.io',
      'ethan.park@lumen.co',
      'noah.wright@helix.ai',
      'emma.davis@orbit.one',
    ],
  },
  {
    team_name: 'Creative Sprint',
    team_code: 'CREATE-03',
    team_notes: 'Rapid concept testing squad',
    created_by_email: 'mia.garcia@lumen.co',
    members: [
      'olivia.kim@verve.studio',
      'liam.brown@verve.studio',
      'harper.nguyen@aurora.dev',
    ],
  },
  {
    team_name: 'Wellness Guild',
    team_code: 'WELL-04',
    team_notes: 'Low-stress social activities',
    created_by_email: 'sophia.reed@helix.ai',
    members: [
      'ava.hughes@northstar.io',
      'olivia.kim@verve.studio',
      'jack.wilson@example.com',
    ],
  },
];

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
  await prisma.dimensionOption.deleteMany({});
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

  // ── Dimension Options ──────────────────────────────────────────────────────
  for (const opt of dimensionOptions) {
    const dimensionId = indexKeyMap.get(opt.index_key);
    if (!dimensionId) {
      console.warn(`⚠️  No dimension with key ${opt.index_key} for options`);
      continue;
    }

    await prisma.dimensionOption.createMany({
      data: opt.allowed_values.map(value => ({
        dimension_id: dimensionId,
        allowed_value: value,
      })),
    });

    console.log(
      `  ✅ [${opt.index_key}] ${opt.allowed_values.length} option value(s)`
    );
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

  // ── Users and Related Tables ───────────────────────────────────────────────
  const userStatusColumnRows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'user'
        AND column_name = 'status'
    ) AS "exists"
  `;
  const hasUserStatusColumn = Boolean(userStatusColumnRows[0]?.exists);

  await prisma.userVector.deleteMany({});
  await prisma.requestPreference.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.teamAggregate.deleteMany({});
  await prisma.teamVector.deleteMany({});
  await prisma.teamMate.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🗑️  Cleared existing users and related data');

  const userIdByEmail = new Map<string, number>();

  for (const seedUser of mockUsers) {
    const userName = deriveUserName(seedUser);
    const createdUser = await prisma.user.create({
      data: {
        email: seedUser.email,
        user_name: userName,
      },
    });

    userIdByEmail.set(seedUser.email, createdUser.id);

    if (hasUserStatusColumn) {
      await prisma.$executeRaw`
        UPDATE "user"
        SET
          "status" = ${seedUser.status},
          "updated_at" = NOW()
        WHERE "id" = ${createdUser.id}
      `;
    }

    if (seedUser.profile) {
      await prisma.profile.create({
        data: {
          user_id: createdUser.id,
          consent_given: seedUser.profile.consent_given,
          first_name: seedUser.profile.first_name ?? null,
          last_name: seedUser.profile.last_name ?? null,
          phone_number: seedUser.profile.phone_number ?? null,
          preferred_contact: seedUser.profile.preferred_contact ?? null,
          privacy_notes: seedUser.profile.privacy_notes ?? null,
        },
      });
    }

    if (seedUser.company) {
      await prisma.company.create({
        data: {
          user_id: createdUser.id,
          corporate_name: seedUser.company.corporate_name ?? null,
          department_name: seedUser.company.department_name ?? null,
          role_title: seedUser.company.role_title ?? null,
          work_mode: seedUser.company.work_mode ?? null,
        },
      });
    }

    for (const requestSeed of seedUser.requests ?? []) {
      const createdRequest = await prisma.request.create({
        data: {
          user_id: createdUser.id,
          objective_category: requestSeed.objective_category ?? null,
          budget_min: requestSeed.budget_min ?? null,
          budget_max: requestSeed.budget_max ?? null,
          delivery_method: requestSeed.delivery_method ?? null,
          duration_max: requestSeed.duration_max ?? null,
        },
      });

      for (const preferenceSeed of requestSeed.preferences ?? []) {
        const dimensionId = indexKeyMap.get(preferenceSeed.index_key);
        if (!dimensionId) {
          console.warn(
            `⚠️  No dimension with key ${preferenceSeed.index_key} for request preference`
          );
          continue;
        }

        await prisma.requestPreference.create({
          data: {
            request_id: createdRequest.id,
            dimension_id: dimensionId,
            desired_score: preferenceSeed.desired_score,
            weight_rate: preferenceSeed.weight_rate,
          },
        });
      }
    }
  }

  for (const teamSeed of mockTeams) {
    const creatorId = userIdByEmail.get(teamSeed.created_by_email);
    if (!creatorId) {
      console.warn(
        `⚠️  No user ${teamSeed.created_by_email} found for team ${teamSeed.team_name}`
      );
      continue;
    }

    const createdTeam = await prisma.team.create({
      data: {
        team_name: teamSeed.team_name,
        team_code: teamSeed.team_code,
        team_notes: teamSeed.team_notes ?? null,
        created_by: creatorId,
      },
    });

    const memberEmails = Array.from(
      new Set([teamSeed.created_by_email, ...teamSeed.members])
    );

    for (const memberEmail of memberEmails) {
      const userId = userIdByEmail.get(memberEmail);
      if (!userId) {
        console.warn(
          `⚠️  No user ${memberEmail} found for team member in ${teamSeed.team_name}`
        );
        continue;
      }

      await prisma.teamMate.create({
        data: {
          team_id: createdTeam.id,
          user_id: userId,
        },
      });
    }
  }

  console.log(
    `✅ Created ${mockUsers.length} users, ${mockTeams.length} teams, and related records`
  );

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
