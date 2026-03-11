import type { PrismaClient } from '@/libs/prisma/client';

type DimensionDataType = 'scale' | 'text';

type DimensionSeed = {
  category: string;
  index_key: string;
  index_name: string;
  data_type: DimensionDataType;
  hard_filter: boolean;
  scale_min?: number;
  scale_max?: number;
};

type DimensionOptionSeed = {
  index_key: string;
  options: {
    option_label: string;
    option_value: string;
  }[];
};

type DimensionDefinition = DimensionSeed & {
  options: string[];
};

const SCALE_1_TO_5 = ['1', '2', '3', '4', '5'];

const dimensionCategories = [
  {
    category_name: 'Experience Design',
    category_desc:
      'Core requirements for energy, intensity, facilitation, and format.',
  },
  {
    category_name: 'Accessibility',
    category_desc:
      'Mobility, sensory, and neuro-inclusion considerations for delivery.',
  },
  {
    category_name: 'Team Context',
    category_desc:
      'Team goals, team context, and supported outcomes for matching.',
  },
  {
    category_name: 'Play Taxonomy',
    category_desc: 'Play nature and play type classifications.',
  },
  {
    category_name: 'Personality Signals',
    category_desc: 'Personality-based play profile signals.',
  },
];

function createOptionValues(values: string[]) {
  return values.map(value => ({
    option_label: value,
    option_value: value,
  }));
}

function createScaleDimension(
  category: string,
  index_key: string,
  index_name: string,
  hard_filter = false
): DimensionDefinition {
  return {
    category,
    index_key,
    index_name,
    data_type: 'scale',
    hard_filter,
    scale_min: 1,
    scale_max: 5,
    options: SCALE_1_TO_5,
  };
}

function createTextDimension(
  category: string,
  index_key: string,
  index_name: string,
  options: string[],
  hard_filter = false
): DimensionDefinition {
  return {
    category,
    index_key,
    index_name,
    data_type: 'text',
    hard_filter,
    options,
  };
}

const dimensionDefinitions: DimensionDefinition[] = [
  createScaleDimension('Experience Design', 'energy_level', 'Energy Level'),
  createScaleDimension('Experience Design', 'activity_level', 'Activity Level'),
  createScaleDimension('Experience Design', 'noise_level', 'Noise Level', true),
  createScaleDimension('Experience Design', 'cognitive_load', 'Cognitive Load'),
  createScaleDimension(
    'Experience Design',
    'social_intensity',
    'Social Intensity'
  ),
  createScaleDimension(
    'Experience Design',
    'competition_level',
    'Competition Level'
  ),
  createScaleDimension(
    'Experience Design',
    'spotlight_level',
    'Spotlight Level'
  ),
  createTextDimension(
    'Experience Design',
    'facilitation_level',
    'Facilitation Level',
    ['Self-led', 'Mixed', 'Facilitated', 'Free play']
  ),
  createTextDimension(
    'Experience Design',
    'customization_level',
    'Customization Level',
    ['Fixed format', 'Semi-custom', 'Highly custom']
  ),
  createScaleDimension(
    'Experience Design',
    'messiness_level',
    'Messiness Level'
  ),
  createScaleDimension(
    'Experience Design',
    'artisticness_required',
    'Artisticness Required'
  ),
  createTextDimension('Experience Design', 'debrief_level', 'Debrief Level', [
    'None',
    'Light',
    'Full facilitated debrief',
  ]),
  createScaleDimension('Experience Design', 'psych_safety', 'Psych Safety'),

  createTextDimension(
    'Accessibility',
    'accessibility_mobility',
    'Accessibility Mobility',
    ['Seated-friendly', 'Standing', 'Walking-heavy', 'Mixed'],
    true
  ),
  createTextDimension(
    'Accessibility',
    'accessibility_sensory',
    'Accessibility Sensory',
    ['Low sensory', 'Mixed', 'High sensory'],
    true
  ),
  createScaleDimension(
    'Accessibility',
    'neurodivergent_inclusive',
    'Neurodivergent Inclusive'
  ),
  createScaleDimension(
    'Accessibility',
    'neurotypical_general',
    'Neurotypical General'
  ),

  createTextDimension('Team Context', 'objective_target', 'Objective Target', [
    'Bonding',
    'Creativity',
    'Communication',
    'Wellbeing',
    'Problem-solving',
  ]),
  createTextDimension(
    'Team Context',
    'objective_category',
    'Objective Category',
    ['TEAM_BONDING', 'TEAM_BUILDING', 'TEAM_DEVELOPMENT']
  ),
  createTextDimension('Team Context', 'team_context', 'Team Context', [
    'New team',
    'Reorg',
    'Remote',
    'Burnout',
    'Conflict',
  ]),
  createTextDimension(
    'Team Context',
    'objectives_supported',
    'Objectives Supported',
    [
      'Connection & Trust',
      'Creativity & Innovation',
      'Problem Solving & Systems Thinking',
      'Learning, Adaptability & Resilience',
      'Stress Relief & Mood',
    ]
  ),

  createTextDimension('Play Taxonomy', 'play_nature', 'Play Nature', [
    'Social',
    'Creative-Maker',
    'Exploratory',
    'Movement',
    'Story',
    'Object',
    'Mindful',
    'Competitive',
    'Imaginative',
  ]),
  createTextDimension('Play Taxonomy', 'play_type', 'Play Type', [
    'Social Play',
    'Creative-Maker Play',
    'Exploratory Play',
    'Storytelling Play',
    'Object Play',
    'Movement Play',
    'Quick Challenges Play',
    'Mindful Play',
    'Role Play',
  ]),

  createScaleDimension(
    'Personality Signals',
    'personality_joker',
    'Personality Joker'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_kinesthete',
    'Personality Kinesthete'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_explorer',
    'Personality Explorer'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_competitor',
    'Personality Competitor'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_director',
    'Personality Director'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_collector',
    'Personality Collector'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_creator_artist',
    'Personality Creator & Artist'
  ),
  createScaleDimension(
    'Personality Signals',
    'personality_storyteller',
    'Personality Storyteller'
  ),
];

const dimensionIndexes: DimensionSeed[] = dimensionDefinitions.map(
  ({ options: _options, ...dimension }) => dimension
);

const dimensionOptions: DimensionOptionSeed[] = dimensionDefinitions.map(
  dimension => ({
    index_key: dimension.index_key,
    options: createOptionValues(dimension.options),
  })
);

export async function seedDimensions(
  prisma: PrismaClient
): Promise<Map<string, number>> {
  await prisma.requestPreference.deleteMany({});
  await prisma.teamAggregate.deleteMany({});
  await prisma.dimensionOption.deleteMany({});
  await prisma.dimensionIndex.deleteMany({});
  await prisma.dimensionCategory.deleteMany({});
  console.log('🗑️  Cleared existing dimensions');

  const categoryIdByName = new Map<string, number>();
  for (const category of dimensionCategories) {
    const created = await prisma.dimensionCategory.create({ data: category });
    categoryIdByName.set(category.category_name, created.id);
    console.log(`✅ Created dimension category: ${category.category_name}`);
  }

  const dimensionIdByKey = new Map<string, number>();
  for (const dimension of dimensionIndexes) {
    const categoryId = categoryIdByName.get(dimension.category);
    if (!categoryId) {
      throw new Error(`Missing dimension category: ${dimension.category}`);
    }

    const created = await prisma.dimensionIndex.create({
      data: {
        index_key: dimension.index_key,
        index_name: dimension.index_name,
        data_type: dimension.data_type,
        hard_filter: dimension.hard_filter,
        scale_min: dimension.scale_min ?? null,
        scale_max: dimension.scale_max ?? null,
        category_id: categoryId,
      },
    });

    dimensionIdByKey.set(dimension.index_key, created.id);
    console.log(
      `  ✅ [${dimension.category}] ${dimension.index_name} (${dimension.index_key})`
    );
  }

  for (const optionSet of dimensionOptions) {
    const dimensionId = dimensionIdByKey.get(optionSet.index_key);
    if (!dimensionId) {
      console.warn(
        `⚠️  No dimension with key ${optionSet.index_key} for options`
      );
      continue;
    }

    await prisma.dimensionOption.createMany({
      data: optionSet.options.map(option => ({
        dimension_id: dimensionId,
        option_label: option.option_label,
        option_value: option.option_value,
      })),
    });

    console.log(
      `  ✅ [${optionSet.index_key}] ${optionSet.options.length} option value(s)`
    );
  }

  return dimensionIdByKey;
}
