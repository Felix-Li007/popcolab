import type { PrismaClient } from '@/libs/prisma/client';
import type { SeedSchemaState } from './schema-state';

type SeedQuestionOption = {
  option_label: string;
  option_value: string;
  option_score: number | null;
};

type SeedQuestion = {
  question_type: 'single_choice' | 'multi_choice' | 'scale' | 'text_input';
  question_text: string;
  question_desc: string;
  order_index: number;
  options: SeedQuestionOption[];
};

type DimMapping = { indexKey: string; weight: number };

export type QuestionIdByOrder = Map<number, number>;

const questions: SeedQuestion[] = [
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
  {
    question_type: 'text_input',
    question_text: 'What kind of check-in question helps your team open up?',
    question_desc: 'Short answer.',
    order_index: 13,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text: 'Describe a moment when your team collaborated really well.',
    question_desc: 'One concrete example.',
    order_index: 14,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text:
      'When a project stalls, what is your first action to regain momentum?',
    question_desc: 'Keep it to 1-2 sentences.',
    order_index: 15,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text: 'What kind of feedback style helps you improve fastest?',
    question_desc: 'Direct, supportive, structured, or other.',
    order_index: 16,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text: 'How do you prefer decisions to be made in group settings?',
    question_desc: 'Consensus, lead-decides, vote, etc.',
    order_index: 17,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text:
      'What helps you stay engaged during long workshops or meetings?',
    question_desc: 'Describe tactics that work for you.',
    order_index: 18,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text:
      'If you could redesign one team ritual, what would you change first?',
    question_desc: 'Share one practical change.',
    order_index: 19,
    options: [],
  },
  {
    question_type: 'text_input',
    question_text:
      'What outcome would make this intake process feel successful to you?',
    question_desc: 'Briefly define success.',
    order_index: 20,
    options: [],
  },
];

const questionDimensionMappings: Record<number, DimMapping[]> = {
  1: [
    { indexKey: 'personality_director', weight: 10 },
    { indexKey: 'social_intensity', weight: 8 },
  ],
  2: [
    { indexKey: 'personality_kinesthete', weight: 10 },
    { indexKey: 'personality_creator_artist', weight: 8 },
    { indexKey: 'personality_joker', weight: 7 },
    { indexKey: 'competition_level', weight: 9 },
    { indexKey: 'personality_explorer', weight: 8 },
  ],
  3: [
    { indexKey: 'cognitive_load', weight: 10 },
    { indexKey: 'personality_joker', weight: 9 },
    { indexKey: 'competition_level', weight: 8 },
    { indexKey: 'personality_creator_artist', weight: 9 },
    { indexKey: 'personality_kinesthete', weight: 10 },
  ],
  4: [
    { indexKey: 'competition_level', weight: 10 },
    { indexKey: 'personality_joker', weight: 8 },
  ],
  5: [
    { indexKey: 'cognitive_load', weight: 7 },
    { indexKey: 'personality_joker', weight: 8 },
    { indexKey: 'personality_kinesthete', weight: 9 },
    { indexKey: 'personality_creator_artist', weight: 9 },
    { indexKey: 'personality_explorer', weight: 8 },
    { indexKey: 'competition_level', weight: 7 },
  ],
  6: [
    { indexKey: 'personality_kinesthete', weight: 9 },
    { indexKey: 'personality_creator_artist', weight: 8 },
    { indexKey: 'personality_collector', weight: 7 },
    { indexKey: 'personality_explorer', weight: 8 },
  ],
  7: [
    { indexKey: 'personality_director', weight: 10 },
    { indexKey: 'personality_joker', weight: 9 },
    { indexKey: 'personality_explorer', weight: 9 },
    { indexKey: 'personality_creator_artist', weight: 9 },
    { indexKey: 'competition_level', weight: 10 },
    { indexKey: 'personality_kinesthete', weight: 9 },
  ],
  8: [
    { indexKey: 'spotlight_level', weight: 10 },
    { indexKey: 'personality_director', weight: 8 },
  ],
  9: [{ indexKey: 'competition_level', weight: 10 }],
  10: [
    { indexKey: 'personality_storyteller', weight: 10 },
    { indexKey: 'personality_explorer', weight: 8 },
  ],
  13: [
    { indexKey: 'psych_safety', weight: 8 },
    { indexKey: 'social_intensity', weight: 7 },
  ],
  14: [
    { indexKey: 'social_intensity', weight: 9 },
    { indexKey: 'psych_safety', weight: 8 },
  ],
  15: [
    { indexKey: 'personality_director', weight: 9 },
    { indexKey: 'cognitive_load', weight: 8 },
  ],
  16: [
    { indexKey: 'debrief_level', weight: 8 },
    { indexKey: 'psych_safety', weight: 7 },
  ],
  17: [
    { indexKey: 'personality_director', weight: 9 },
    { indexKey: 'facilitation_level', weight: 8 },
  ],
  18: [
    { indexKey: 'activity_level', weight: 7 },
    { indexKey: 'cognitive_load', weight: 8 },
  ],
  19: [
    { indexKey: 'personality_explorer', weight: 8 },
    { indexKey: 'customization_level', weight: 8 },
  ],
  20: [
    { indexKey: 'objectives_supported', weight: 8 },
    { indexKey: 'objective_category', weight: 7 },
  ],
};

export async function seedQuestions(
  prisma: PrismaClient,
  schemaState: Pick<
    SeedSchemaState,
    'hasFormQuestionTable' | 'hasFormDimensionTable' | 'hasIntakeFormTable'
  >
): Promise<QuestionIdByOrder> {
  if (schemaState.hasFormQuestionTable) {
    await prisma.$executeRaw`DELETE FROM "form_question"`;
    console.log('🗑️  Cleared existing form_question mappings');
  }
  if (schemaState.hasFormDimensionTable) {
    await prisma.$executeRaw`DELETE FROM "form_dimension"`;
    console.log('🗑️  Cleared existing form_dimension mappings');
  }
  if (schemaState.hasIntakeFormTable) {
    await prisma.$executeRaw`DELETE FROM "intake_form"`;
    console.log('🗑️  Cleared existing intake forms');
  }

  await prisma.answer.deleteMany({});
  await prisma.questionDimension.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  console.log('🗑️  Cleared existing questions');

  for (const question of questions) {
    const { options, ...questionData } = question;
    await prisma.question.create({
      data: {
        ...questionData,
        options: {
          create: options.map(option => ({
            option_label: option.option_label,
            option_value: option.option_value,
            option_score: option.option_score ?? null,
          })),
        },
      },
    });
    console.log(
      `✅ Created question [${questionData.question_type}]: ${questionData.question_text.slice(0, 50)}…`
    );
  }

  const rows = await prisma.question.findMany({
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
  });

  const questionIdByOrder = new Map<number, number>();
  for (const row of rows) {
    if (typeof row.order_index === 'number') {
      questionIdByOrder.set(row.order_index, row.id);
    }
  }

  return questionIdByOrder;
}

export async function seedQuestionDimensionMappings(
  prisma: PrismaClient,
  questionIdByOrder: QuestionIdByOrder,
  dimensionIdByKey: Map<string, number>
): Promise<void> {
  for (const [orderIndex, mappings] of Object.entries(
    questionDimensionMappings
  )) {
    const questionId = questionIdByOrder.get(Number(orderIndex));
    if (!questionId) {
      console.warn(`⚠️  No question with order_index ${orderIndex}`);
      continue;
    }

    for (const mapping of mappings) {
      const dimensionId = dimensionIdByKey.get(mapping.indexKey);
      if (!dimensionId) {
        console.warn(`⚠️  No dimension with key ${mapping.indexKey}`);
        continue;
      }

      await prisma.questionDimension.create({
        data: {
          question_id: questionId,
          dimension_id: dimensionId,
          weight_rate: mapping.weight,
        },
      });
    }

    console.log(`✅ Wired ${mappings.length} dimension(s) → Q#${orderIndex}`);
  }
}
