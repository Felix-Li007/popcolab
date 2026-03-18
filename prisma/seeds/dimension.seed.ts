import type { PrismaClient } from '@/libs/prisma/client';
import { EXPERIENCE_DIMENSION_KEYS } from './experience-dimension-keys';

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

function humanizeKey(value: string): string {
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function createImportedScaleDimension(
  category: string,
  index_key: string,
  hard_filter = false
): DimensionDefinition {
  return createScaleDimension(
    category,
    index_key,
    humanizeKey(index_key),
    hard_filter
  );
}

function createImportedTextDimension(
  category: string,
  index_key: string,
  options: string[],
  hard_filter = false
): DimensionDefinition {
  return createTextDimension(
    category,
    index_key,
    humanizeKey(index_key),
    options,
    hard_filter
  );
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
];

const importedDimensionDefinitions: DimensionDefinition[] = [
  createImportedTextDimension('Accessibility', 'support_category', [
    'No support (I jump in)',
    'Light support (a warm-up helps)',
    'A lot of support (I need strong structure + opt-out options)',
  ]),
  createImportedScaleDimension('Accessibility', 'support_need'),
  createImportedScaleDimension('Team Context', 'psych_safety'),
  createImportedTextDimension('Team Context', 'social_initiation', [
    'Start mingling with the first person you see',
    'Find someone approachable and start a conversation',
    'Wait until someone comes up to you',
    'Hang back near the food/edge of the room until you feel comfortable',
  ]),
  createImportedTextDimension('Experience Design', 'activity_scenario', [
    'Jump in immediately',
    'Try it after watching 1-2 people',
    'Try it if I can do it with a buddy',
    'Prefer to observe / pass',
  ]),
  createImportedTextDimension('Experience Design', 'spotlight_scenario', [
    'Love it',
    "It's okay sometimes",
    'Prefer small groups',
    'Prefer to avoid spotlight',
  ]),
  createImportedTextDimension('Accessibility', 'supports_helpful', [
    'Clear step-by-step instructions',
    'A quick demo example',
    'Doing it with a buddy',
    'Choice of roles (talking vs making)',
    'Permission to pass',
    'Small-group breakouts',
    'Quiet corner / breaks',
    'Time to think before sharing',
    'No scoring / low competition',
    'Hands-on task (less talking)',
  ]),
  createImportedScaleDimension('Experience Design', 'structure_pref'),
  createImportedScaleDimension('Accessibility', 'safety_optout'),
  createImportedScaleDimension('Personality Signals', 'person_joker'),
  createImportedScaleDimension('Personality Signals', 'person_kinesthete'),
  createImportedScaleDimension('Personality Signals', 'person_explorer'),
  createImportedScaleDimension('Personality Signals', 'person_competitor'),
  createImportedScaleDimension('Personality Signals', 'person_director'),
  createImportedScaleDimension('Personality Signals', 'person_collector'),
  createImportedScaleDimension('Personality Signals', 'person_creator_artist'),
  createImportedScaleDimension('Personality Signals', 'person_storyteller'),
  createImportedTextDimension('Play Taxonomy', 'play_nature', [
    'Social (with others)',
    'Creative/Maker (making things)',
    'Exploratory (curiosity, discovery)',
    'Movement/Physical',
    'Story/Narrative',
    'Object/Hands-on (tinkering)',
    'Mindful/Reflective',
    'Competitive/Challenge',
    'Imaginative/Role-play',
  ]),
  createImportedTextDimension('Play Taxonomy', 'play_types', [
    'Social Play',
    'Creative / Maker Play',
    'Exploratory / Curiosity Play',
    'Storytelling / Narrative Play',
    'Object Play',
  ]),
  createImportedScaleDimension('Experience Design', 'energy_score'),
  createImportedScaleDimension('Experience Design', 'noise_level', true),
  createImportedScaleDimension('Experience Design', 'social_intensity'),
  createImportedScaleDimension('Experience Design', 'competition_level'),
  createImportedScaleDimension('Experience Design', 'spotlight_level'),
  createImportedScaleDimension('Experience Design', 'creative_confidence'),
  createImportedScaleDimension('Experience Design', 'openness_new'),
  createImportedTextDimension('Play Taxonomy', 'childhood_play', [
    'Building LEGO / forts (Object Play)',
    'Drawing / crafts / making things (Creative Play)',
    'Sports / tag / running',
  ]),
  createImportedTextDimension('Play Taxonomy', 'childhood_open', []),
  createImportedTextDimension('Accessibility', 'avoid_elements', [
    'Being put on the spot',
    'High competition',
    'Loud noise',
    'Messy materials',
    'Physical contact',
    'Personal sharing',
  ]),
  createImportedTextDimension('Accessibility', 'neuro_supports', [
    'Clear written + spoken instructions',
    'More time to process',
    'Breaks / step away',
    'Quiet/low-sensory',
  ]),
  createImportedTextDimension('Accessibility', 'accessibility_notes', []),
  createImportedTextDimension('Personality Signals', 'enneagram_taken', [
    'Yes',
    'No',
    'Not sure',
  ]),
  createImportedTextDimension('Personality Signals', 'enneagram_type', [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'Not sure',
  ]),
  createImportedTextDimension('Personality Signals', 'enneagram_wing', [
    '1w9',
    '1w2',
    '2w1',
    '2w3',
    '3w2',
    '3w4',
    '4w3',
    '4w5',
    '5w4',
    '5w6',
    '6w5',
    '6w7',
    '7w6',
    '7w8',
    '8w7',
    '8w9',
    '9w8',
    '9w1',
    'No',
  ]),
  createImportedTextDimension('Personality Signals', 'enneagram_instinct', [
    'sp/so',
    'sp/sx',
    'so/sp',
    'so/sx',
    'sx/sp',
    'sx/so',
    'Not sure',
  ]),
];

const requestDimensionDefinitions: DimensionDefinition[] = [
  createImportedTextDimension('Team Context', 'activity_for', [
    'Team Bonding',
    'Team Building',
    'Team Development',
    'Birthday Party',
    'Staff Party',
    'Group of friends getting together',
    'Date night',
    'Retirement party',
    'Hosting clients',
    'Family get together',
    'Other',
  ]),
  createImportedTextDimension('Team Context', 'objective_category', [
    'Team Bonding',
    'Team Building',
    'Team Development',
    'Not sure',
  ]),
  createImportedTextDimension(
    'Team Context',
    'team_objective_definitions_info',
    []
  ),
  createImportedTextDimension('Team Context', 'success_criteria', [
    'Working agreements / norms',
    'Better communication',
    'Clearer alignment & expectations',
    'Action plan / next steps',
    'More trust & psychological safety',
    'More connection & belonging',
    'New skills / tools learned',
    'More creativity / new ideas',
    'Lower stress / better morale',
  ]),
  createImportedTextDimension(
    'Accessibility',
    'constraints_hard',
    [
      'No alcohol',
      'Accessible for mobility needs',
      'Accessible for sensory needs (low noise/low light)',
      'Dietary restrictions must be supported',
      'No physical contact',
      'Virtual or hybrid only',
      'Must be travel-friendly (flying teams)',
    ],
    true
  ),
  createImportedTextDimension('Experience Design', 'constraints_soft', [
    'Avoid competition',
    'Avoid being put on the spot',
    'Avoid personal sharing / vulnerability',
    'Avoid loud noise',
    'Avoid messy materials',
    'Avoid complex instructions',
    'Keep it low energy',
  ]),
  createImportedTextDimension('Experience Design', 'constraint_strictness', [
    'Soft preferences (try to match)',
    'Hard filters (do not show if violated)',
  ]),
  createImportedScaleDimension('Experience Design', 'debrief_importance'),
  createImportedTextDimension('Team Context', 'team_context', [
    'New team / new manager',
    'Recently reorganized',
    'Mostly remote / rebuilding',
  ]),
  createImportedScaleDimension('Team Context', 'psych_safety'),
  createImportedScaleDimension('Team Context', 'team_readiness'),
  createImportedTextDimension('Team Context', 'remote_count', []),
  createImportedTextDimension('Experience Design', 'date_flexibility', [
    'Exact date(s) only',
    'Flexible within 1 week',
    'Flexible within 2-4 weeks',
    'Flexible',
  ]),
  createImportedTextDimension('Experience Design', 'preferred_time', [
    'Morning',
    'Midday / Afternoon',
    'Evening',
    'Any',
  ]),
  createImportedTextDimension('Experience Design', 'proposal_deadline', []),
  createImportedTextDimension('Experience Design', 'duration_bucket', [
    '<45',
    '45-60',
    '60-90',
    '90-120',
    '120-180',
    '180+',
  ]),
  createImportedTextDimension('Experience Design', 'book_hours', [
    '0.75',
    '1',
    '1.5',
    '2',
    '2.5',
    '3',
    '4',
    '4+',
  ]),
  createImportedTextDimension('Experience Design', 'delivery_methods', [
    'On-site (Pop CoLab)',
    'Off-site (your location)',
    'Virtual',
    'Hybrid',
  ]),
  createImportedTextDimension('Experience Design', 'location_city', []),
  createImportedTextDimension('Experience Design', 'location_notes', []),
  createImportedTextDimension('Team Context', 'budget_range', [
    '<$500',
    '$500-$1000',
    '$1000-$2500',
    '$2500-$5000',
    '$5000+',
    'Not sure yet',
  ]),
  createImportedTextDimension('Team Context', 'newsletter_option', [
    'Yes',
    'No',
  ]),
  createImportedTextDimension('Team Context', 'objectives_support', [
    'Strengthen team connections',
    'Spark creativity',
    'Boost morale',
    'Improve communication',
  ]),
  createImportedTextDimension('Team Context', 'success_criteria_definition', [
    'People felt more connected',
    'We have clearer ways of working / norms',
    'We learned something new',
    'Energy / morale improved',
  ]),
  createImportedTextDimension('Experience Design', 'format_preferences', [
    'DIY / Make & Take',
    'Games',
    'Trivia',
    'Wellness / Movement',
    'Learning Lab (talk + activity)',
  ]),
  createImportedTextDimension('Experience Design', 'previous_activities', []),
  createImportedTextDimension('Experience Design', 'lead_preferences', [
    'Facilitated (host-led)',
    'Mixed (guided + self-led)',
    'Stations / drop-in',
    'Free play (self-led)',
  ]),
  createImportedTextDimension('Experience Design', 'provider_preference', [
    'Pop CoLab only',
    'Open to Pop CoLab + partners',
    'Open to Pop CoLab + partners + outside vendors',
  ]),
  createImportedTextDimension('Play Taxonomy', 'play_types', [
    'Social Play',
    'Creative / Maker Play',
    'Exploratory / Curiosity Play',
    'Storytelling / Roleplay',
  ]),
  createImportedScaleDimension('Experience Design', 'energy_level'),
  createImportedScaleDimension('Experience Design', 'activity_level'),
  createImportedScaleDimension('Experience Design', 'noise_tolerance', true),
  createImportedTextDimension(
    'Experience Design',
    'quiet_requirement',
    ['No limit', 'Prefer quiet', 'Must be quiet'],
    true
  ),
  createImportedScaleDimension('Experience Design', 'cognitive_load'),
  createImportedScaleDimension('Experience Design', 'social_intensity'),
  createImportedScaleDimension('Experience Design', 'competition_level'),
  createImportedScaleDimension('Experience Design', 'spotlight_level'),
  createImportedScaleDimension('Experience Design', 'messiness_level'),
  createImportedScaleDimension('Experience Design', 'creative_confidence'),
  createImportedScaleDimension('Experience Design', 'openness_surprise'),
  createImportedScaleDimension('Accessibility', 'neuroinclusive_priority'),
  createImportedTextDimension(
    'Accessibility',
    'accessibility_mobility',
    [
      'None',
      'Wheelchair accessible',
      'Avoid stairs',
      'Seated option needed',
      'Frequent breaks',
    ],
    true
  ),
  createImportedTextDimension(
    'Accessibility',
    'accessibility_sensory',
    ['None', 'Quiet space available', 'Lower noise preferred', 'Lower scent'],
    true
  ),
  createImportedTextDimension('Accessibility', 'accessibility_hearing', [
    'None',
    'Captions (virtual)',
    'Mic / speaker support',
    'Face speakers when talking',
  ]),
  createImportedTextDimension('Accessibility', 'accessibility_vision', [
    'None',
    'Large print',
    'High contrast visuals',
    'Verbal instructions',
    'Other (add in notes)',
  ]),
  createImportedTextDimension('Experience Design', 'take_item', [
    'Yes',
    'No',
    'Either',
  ]),
  createImportedTextDimension('Experience Design', 'travel_flying', [
    'No',
    'Some are flying',
    'Most are flying',
  ]),
  createImportedTextDimension('Experience Design', 'alcohol_policy', [
    'No alcohol (zero-proof only)',
    'Alcohol allowed',
    'Not sure',
  ]),
  createImportedTextDimension('Accessibility', 'dietary_considerations', [
    'None',
    'Vegetarian',
    'Vegan',
    'Gluten-free',
    'Halal',
    'Kosher',
    'Nut allergy',
    'Dairy-free',
  ]),
  createImportedTextDimension('Team Context', 'theme_or_branding', []),
  createImportedTextDimension('Experience Design', 'customization_level', [
    'Off-the-shelf',
    'Some customization',
    'Fully customized',
    'Not sure',
  ]),
  createImportedTextDimension('Experience Design', 'debrief_level', [
    'No debrief',
    'Light debrief (5-10 min)',
    'Structured debrief (15-20 min)',
  ]),
  createImportedTextDimension('Experience Design', 'report_needed', [
    'No',
    'Nice to have',
    'Yes',
  ]),
  createImportedTextDimension('Team Context', 'language_preference', [
    'English',
    'French',
    'Bilingual',
    'Other',
  ]),
  createImportedTextDimension('Team Context', 'culture_vibe', [
    'Playful & silly',
    'Warm & conversational',
    'Calm & reflective',
    'Competitive & energetic',
  ]),
  createImportedTextDimension('Team Context', 'additional_notes', []),
];

function mergeDimensionDefinitions(
  definitions: DimensionDefinition[]
): DimensionDefinition[] {
  const merged = new Map<string, DimensionDefinition>();
  for (const definition of definitions) {
    merged.set(definition.index_key, definition);
  }
  return Array.from(merged.values());
}

const mergedDimensionDefinitions = mergeDimensionDefinitions([
  ...dimensionDefinitions,
  ...importedDimensionDefinitions,
  ...requestDimensionDefinitions,
]);

const dimensionIndexes: DimensionSeed[] = mergedDimensionDefinitions.map(
  dimension => {
    const dimensionData = { ...dimension };
    delete (dimensionData as Partial<DimensionDefinition>).options;
    return dimensionData;
  }
);

const dimensionOptions: DimensionOptionSeed[] = mergedDimensionDefinitions.map(
  dimension => ({
    index_key: dimension.index_key,
    options: createOptionValues(dimension.options),
  })
);

export async function seedDimensions(
  prisma: PrismaClient
): Promise<Map<string, number>> {
  async function clearTableIfExists(tableName: string) {
    await prisma.$executeRawUnsafe(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}') THEN EXECUTE 'DELETE FROM "${tableName}"'; END IF; END $$;`
    );
  }

  // Clear dependent rows first so restrictive FKs on dimension_index do not block reseeding.
  await prisma.experienceDimension.deleteMany({});
  await prisma.questionDimension.deleteMany({});
  await prisma.requestPreference.deleteMany({});
  await prisma.teamAggregate.deleteMany({});
  await clearTableIfExists('dimension_apply');
  await clearTableIfExists('form_dimension');
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

    if (optionSet.options.length === 0) {
      console.log(`  ✅ [${optionSet.index_key}] 0 option value(s)`);
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

  const experienceDimensionApplyRows = EXPERIENCE_DIMENSION_KEYS.map(
    indexKey => {
      const dimensionId = dimensionIdByKey.get(indexKey);
      if (!dimensionId) {
        throw new Error(
          `Missing dimension with key ${indexKey} for EXPERIENCE form mapping`
        );
      }

      return {
        dimension_id: dimensionId,
        form_name: 'EXPERIENCE' as const,
      };
    }
  );

  if (experienceDimensionApplyRows.length > 0) {
    await prisma.dimensionApply.createMany({
      data: experienceDimensionApplyRows,
    });
    console.log(
      `  ✅ [EXPERIENCE] ${experienceDimensionApplyRows.length} dimension apply mapping(s)`
    );
  }

  return dimensionIdByKey;
}
