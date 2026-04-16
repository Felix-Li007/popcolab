import type { PrismaClient } from '@/libs/prisma/client';
import type { SeedSchemaState } from './schema-state';

type SeedQuestionOption = {
  option_label: string;
  option_value: string;
  option_score: number | null;
};

type SeedIntakeForm = 'REQUEST' | 'MEMBER' | 'ASSESS' | 'EXPERIENCE';

type SeedQuestion = {
  form_name: SeedIntakeForm;
  question_type: 'single_choice' | 'multi_choice' | 'scale' | 'text_input';
  question_text: string;
  question_desc: string;
  order_index: number;
  options: SeedQuestionOption[];
  dimension_key?: string;
};

export type QuestionIdByOrder = Map<number, number>;

function toOptionValue(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/\+/g, ' plus ')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50) || 'option'
  );
}

function createChoiceOptions(labels: string[]): SeedQuestionOption[] {
  return labels.map(label => ({
    option_label: label,
    option_value: toOptionValue(label),
    option_score: null,
  }));
}

function createScaleOptions(): SeedQuestionOption[] {
  return [
    { option_label: '1', option_value: 'min', option_score: null },
    { option_label: '5', option_value: 'max', option_score: null },
    { option_label: '1', option_value: 'step', option_score: null },
  ];
}

function createTextOptions(
  placeholder: string,
  maxChars = 250
): SeedQuestionOption[] {
  return [
    {
      option_label: placeholder,
      option_value: 'placeholder',
      option_score: null,
    },
    {
      option_label: String(maxChars),
      option_value: 'max_chars',
      option_score: null,
    },
  ];
}

function single(
  order_index: number,
  question_text: string,
  labels: string[],
  form_name: SeedIntakeForm = 'REQUEST'
): SeedQuestion {
  return {
    form_name,
    question_type: 'single_choice',
    question_text,
    question_desc: '',
    order_index,
    options: createChoiceOptions(labels),
  };
}

function multi(
  order_index: number,
  question_text: string,
  labels: string[],
  form_name: SeedIntakeForm = 'REQUEST'
): SeedQuestion {
  return {
    form_name,
    question_type: 'multi_choice',
    question_text,
    question_desc: '',
    order_index,
    options: createChoiceOptions(labels),
  };
}

function scale(
  order_index: number,
  question_text: string,
  form_name: SeedIntakeForm = 'REQUEST'
): SeedQuestion {
  return {
    form_name,
    question_type: 'scale',
    question_text,
    question_desc: '',
    order_index,
    options: createScaleOptions(),
  };
}

function text(
  order_index: number,
  question_text: string,
  placeholder = 'Type your answer here...',
  maxChars = 250,
  form_name: SeedIntakeForm = 'REQUEST'
): SeedQuestion {
  return {
    form_name,
    question_type: 'text_input',
    question_text,
    question_desc: '',
    order_index,
    options: createTextOptions(placeholder, maxChars),
  };
}

function withDimension(
  question: SeedQuestion,
  dimension_key: string
): SeedQuestion {
  return {
    ...question,
    dimension_key,
  };
}

function mergeQuestionsByText(items: SeedQuestion[]): SeedQuestion[] {
  const merged = new Map<string, SeedQuestion>();

  for (const item of items) {
    merged.set(item.question_text, item);
  }

  return [...merged.values()].sort((a, b) => a.order_index - b.order_index);
}

// The current app only supports single_choice, multi_choice, scale, and
// text_input. Screenshot rows marked as "number" or free-entry "multi" are
// initialized as text_input to keep the seed compatible with the UI.
const baseQuestions: SeedQuestion[] = [
  single(1, 'What is your group activity for?', [
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
  single(
    2,
    'Which primary objective best describes what you want most from this experience?',
    ['Team Bonding', 'Team Building', 'Team Development', 'Not sure']
  ),
  multi(3, 'What would make this a success? Pick up to 2 outcomes.', [
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
  multi(
    4,
    'Hard constraints (must-have / must-avoid). Select all that apply.',
    [
      'No alcohol',
      'Accessible for mobility needs',
      'Accessible for sensory needs (low noise/low light)',
      'Dietary restrictions must be supported',
      'No physical contact',
      'Virtual or hybrid only',
      'Must be travel-friendly (flying teams)',
    ]
  ),
  multi(
    5,
    "Preferences (we'd like to avoid these if possible). Select all that apply.",
    [
      'Avoid competition',
      'Avoid being put on the spot',
      'Avoid personal sharing/vulnerability',
      'Avoid loud noise',
      'Avoid messy materials',
      'Avoid complex instructions',
      'Keep it low energy',
    ]
  ),
  single(6, 'How strict should we be with your preference constraints?', [
    'Soft preferences (try to match)',
    'Hard filters (do not show if violated)',
  ]),
  scale(
    7,
    'How important is reflection/debrief in the experience? (1 not important - 5 essential)'
  ),
  text(8, 'How many people are participating?', 'Enter the participant count'),
  multi(
    9,
    'Which statements best describe your team right now? (select all that apply)',
    [
      'New team / new manager',
      'Recently reorganized',
      'Mostly remote / rebuilding',
    ]
  ),
  scale(10, 'Team psychological safety baseline (1 low trust - 5 high trust).'),
  scale(
    11,
    'How ready is your team for team-building activities that involve sharing, vulnerability, or personal growth?'
  ),
  text(
    12,
    'How many will be in-person (if hybrid)?',
    'Enter the in-person count'
  ),
  text(
    13,
    'How many will be remote/virtual (if hybrid)?',
    'Enter the remote count'
  ),
  text(14, 'Preferred date(s) (up to 3)', 'List up to 3 preferred dates'),
  single(15, 'How flexible are you on dates?', [
    'Exact date(s) only',
    'Flexible within 1 week',
    'Flexible within 2-4 weeks',
    'Flexible',
  ]),
  single(16, 'Preferred time window', [
    'Morning',
    'Midday/Afternoon',
    'Evening',
    'Any',
  ]),
  text(
    17,
    'Do you have a hard deadline to have a proposal in hand? If so, what date/time?',
    'Share the deadline date/time'
  ),
  single(18, 'How long do you have for the experience?', [
    '<45',
    '45-60',
    '60-90',
    '90-120',
    '120-180',
    '180+',
  ]),
  single(19, 'How many hours are you looking to book? (if you know)', [
    '0.75',
    '1',
    '1.5',
    '2',
    '2.5',
    '3',
    '4',
    '4+',
  ]),
  multi(20, 'Where do you want this to happen? (select all that apply)', [
    'On-site (Pop CoLab)',
    'Off-site (your location)',
    'Virtual',
    'Hybrid',
  ]),
  text(21, 'City (if off-site)', 'Enter the city'),
  text(
    22,
    'If off-site/hybrid: share address area + venue notes (parking, elevators, room setup)',
    'Share venue details'
  ),
  single(23, 'What is your estimated budget range (before tax + travel)?', [
    '<$500',
    '$500-$1000',
    '$1000-$2500',
    '$2500-$5000',
    '$5000+',
    'Not sure yet',
  ]),
  single(24, 'Would you like to be added to our newsletter for updates?', [
    'Yes',
    'No',
  ]),
  multi(25, 'Team objective(s) (select all that apply)', [
    'Strengthen team connections',
    'Spark creativity',
    'Boost morale',
    'Improve communication',
  ]),
  multi(26, 'Pick your top 3 goals (rank 1-3).', [
    'Connection & trust',
    'Belonging / team rituals / celebration',
    'Communication & collaboration',
    'Creativity & new ideas',
  ]),
  multi(27, 'How will you know this was successful? (select all that apply)', [
    'People felt more connected',
    'We have clearer ways of working / norms',
    'We learned something new',
    'Energy / morale improved',
  ]),
  multi(28, 'Preferred formats (select all that apply).', [
    'DIY / Make & Take',
    'Games',
    'Trivia',
    'Wellness / Movement',
    'Learning Lab (talk + activity)',
  ]),
  text(
    29,
    "What have you tried before (team activities) and what worked / didn't work?",
    'Share what your team has already tried',
    500
  ),
  multi(30, 'How do you want it led? (select all that apply)', [
    'Facilitated (host-led)',
    'Mixed (guided + self-led)',
    'Stations / drop-in',
    'Free play (self-led)',
  ]),
  single(31, 'Provider preference?', [
    'Pop CoLab only',
    'Open to Pop CoLab + partners',
    'Open to Pop CoLab + partners + outside vendors',
  ]),
  multi(32, 'What kinds of play should show up? Pick your top 3 (rank 1-3).', [
    'Social Play',
    'Creative / Maker Play',
    'Exploratory / Curiosity Play',
    'Storytelling / Roleplay',
  ]),
  scale(33, 'Energy preference (1 relaxed - 5 high energy).'),
  scale(34, 'Movement level (1 mostly seated - 5 lots of movement).'),
  scale(35, 'Noise tolerance (1 prefer quiet - 5 loud is fine).'),
  single(36, 'Do you need to keep things quiet?', [
    'No limit',
    'Prefer quiet',
    'Must be quiet',
  ]),
  scale(37, 'Cognitive load (1 chill + simple - 5 strategic/problem-solving).'),
  scale(
    38,
    'Social intensity (1 low-pressure / parallel - 5 highly interactive).'
  ),
  scale(39, 'Competition comfort (1 none - 5 bring the leaderboard).'),
  scale(40, 'Spotlight comfort (1 no performing - 5 love performing).'),
  scale(41, 'Messiness tolerance (1 keep it clean - 5 mess is fine).'),
  scale(
    42,
    "Creative confidence required (1 no art skills please - 5 we're all-in on creating)."
  ),
  scale(
    43,
    'How open is your team to trying something new? (1 stay safe - 5 surprise us)'
  ),
  scale(
    44,
    'How important is neuroinclusive design for this group? (1 standard - 5 very important/access needs)'
  ),
  multi(45, 'Any mobility/access needs? (select all that apply)', [
    'None',
    'Wheelchair accessible',
    'Avoid stairs',
    'Seated option needed',
    'Frequent breaks',
  ]),
  multi(46, 'Any sensory needs we should plan for? (select all that apply)', [
    'None',
    'Quiet space available',
    'Lower noise preferred',
    'Lower scent',
  ]),
  multi(47, 'Any hearing access needs? (select all that apply)', [
    'None',
    'Captions (virtual)',
    'Mic/speaker support',
    'Face speakers when talking',
  ]),
  multi(48, 'Any vision access needs? (select all that apply)', [
    'None',
    'Large print',
    'High contrast visuals',
    'Verbal instructions',
    'Other',
  ]),
  single(49, 'Do you want a make-and-take item?', ['Yes', 'No', 'Either']),
  single(50, 'Are people flying / limited for take-home items?', [
    'No',
    'Some are flying',
    'Most are flying',
  ]),
  single(51, 'Alcohol policy for your team event?', [
    'No alcohol (zero-proof only)',
    'Alcohol allowed',
    'Not sure',
  ]),
  multi(
    52,
    'Any dietary considerations? (only affects tasting/food experiences)',
    [
      'None',
      'Vegetarian',
      'Vegan',
      'Gluten-free',
      'Halal',
      'Kosher',
      'Nut allergy',
      'Dairy-free',
    ]
  ),
  text(
    53,
    'Any theme, brand colours, or company values you want woven in? (optional)',
    'Share any theme, brand, or values notes'
  ),
  single(54, 'How customized should this be?', [
    'Off-the-shelf',
    'Some customization',
    'Fully customized',
    'Not sure',
  ]),
  single(55, 'Do you want a debrief/reflection built in?', [
    'No debrief',
    'Light debrief (5-10 min)',
    'Structured debrief (15-20 min)',
  ]),
  single(56, 'Do you need a short post-event summary/report?', [
    'No',
    'Nice to have',
    'Yes',
  ]),
  single(57, 'Language preference for facilitation/materials (optional)', [
    'English',
    'French',
    'Bilingual',
    'Other',
  ]),
  single(58, "Your team's vibe (optional): what feels right?", [
    'Playful & silly',
    'Warm & conversational',
    'Calm & reflective',
    'Competitive & energetic',
  ]),
  text(
    59,
    'Anything else we should know? (schedule, culture, sensitivities, must-avoid, etc.)',
    'Add any other context',
    500
  ),
  single(
    60,
    'When it comes to playful team activities, I usually need...',
    [
      'No support (I jump in)',
      'Light support (a warm-up helps)',
      'A lot of support (I need strong structure + opt-out options)',
    ],
    'MEMBER'
  ),
  scale(
    61,
    'Support need (1 jump in - 5 I need lots of support/structure).',
    'MEMBER'
  ),
  scale(
    62,
    'In group settings at work, I feel psychologically safe to try new things. (1 least like me - 5 most like me)',
    'MEMBER'
  ),
  single(
    63,
    "You're at a social event where you don't know anyone. You...",
    [
      'Start mingling with the first person you see',
      'Find someone approachable and start a conversation',
      'Wait until someone comes up to you',
      'Hang back near the food/edge of the room until you feel comfortable',
    ],
    'MEMBER'
  ),
  single(
    64,
    'A facilitator invites the group to try something new (slightly awkward). You...',
    [
      'Jump in immediately',
      'Try it after watching 1-2 people',
      'Try it if I can do it with a buddy',
      'Prefer to observe / pass',
    ],
    'MEMBER'
  ),
  single(
    65,
    'If an activity puts me on the spot (performing / sharing in front of everyone), I...',
    [
      'Love it',
      "It's okay sometimes",
      'Prefer small groups',
      'Prefer to avoid spotlight',
    ],
    'MEMBER'
  ),
  multi(
    66,
    'What helps you feel comfortable joining in? (select all that apply)',
    [
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
    ],
    'MEMBER'
  ),
  scale(
    67,
    'I prefer activities with clear steps and structure (1 free-flow - 5 very structured).',
    'MEMBER'
  ),
  scale(
    68,
    'If I opt out of an activity, I feel comfortable doing so. (1 not comfortable - 5 very comfortable)',
    'MEMBER'
  ),
  scale(
    69,
    'Joker: I like humour, surprises, and keeping things light. (1-5)',
    'MEMBER'
  ),
  scale(
    70,
    'Kinesthete: I like movement, hands-on, and physical engagement. (1-5)',
    'MEMBER'
  ),
  scale(
    71,
    'Explorer: I like curiosity, trying new things, and discovering. (1-5)',
    'MEMBER'
  ),
  scale(
    72,
    'Competitor: I like challenge, goals, and friendly competition. (1-5)',
    'MEMBER'
  ),
  scale(
    73,
    'Director: I like organizing people, leading, and shaping the plan. (1-5)',
    'MEMBER'
  ),
  scale(
    74,
    'Collector: I like gathering, sorting, and building connections/knowledge. (1-5)',
    'MEMBER'
  ),
  scale(
    75,
    'Creator/Artist: I like making, designing, and expressing ideas. (1-5)',
    'MEMBER'
  ),
  scale(
    76,
    'Storyteller: I like stories, meaning, and sharing experiences. (1-5)',
    'MEMBER'
  ),
  single(
    77,
    "I'm most likely to...",
    [
      'Crack a joke and lighten the mood (Joker)',
      'Organize the group and suggest a plan (Director)',
    ],
    'MEMBER'
  ),
  single(
    78,
    "When I have free time, I'd rather...",
    [
      'Explore something new / try a new spot (Explorer)',
      'Work on a project I can make (Creator/Artist)',
    ],
    'MEMBER'
  ),
  single(
    79,
    'In a group activity, I naturally...',
    [
      'Get competitive and chase the goal (Competitor)',
      "Focus on the story/meaning of what we're doing",
    ],
    'MEMBER'
  ),
  single(
    80,
    'I feel most engaged when...',
    [
      "I'm moving / hands-on / doing (Kinesthete)",
      "I'm collecting info, pieces, or resources (Collector)",
    ],
    'MEMBER'
  ),
  single(
    81,
    "If there's ambiguity, I usually...",
    [
      'Make a plan and assign roles (Director)',
      'Wander, test, and discover as I go (Explorer)',
    ],
    'MEMBER'
  ),
  single(
    82,
    'When someone shares a problem, I tend to...',
    [
      'Offer a practical next step / structure (Director)',
      'Offer a creative idea or twist (Creator/Artist)',
    ],
    'MEMBER'
  ),
  single(
    83,
    "My 'fun' leans more toward...",
    [
      'Friendly rivalry and scorekeeping (Competitor)',
      'Silly moments and playful chaos (Joker)',
    ],
    'MEMBER'
  ),
  single(
    84,
    "If I'm learning something new, I prefer...",
    [
      'Hands-on practice right away (Kinesthete)',
      'Hearing the story/context first (Storyteller)',
    ],
    'MEMBER'
  ),
  single(
    85,
    "I'm most likely to enjoy...",
    [
      'Collecting/curating things or knowledge (Collector)',
      'Making something with my hands (Creator/Artist)',
    ],
    'MEMBER'
  ),
  single(
    86,
    'At events, I usually...',
    [
      'Meet new people for fun (Explorer)',
      'Stick with my people and go deeper (Storyteller)',
    ],
    'MEMBER'
  ),
  single(
    87,
    "If a game is happening, I'm pulled by...",
    [
      'Winning / challenge (Competitor)',
      'The experience / narrative / vibe (Storyteller)',
    ],
    'MEMBER'
  ),
  single(
    88,
    'My default in groups is...',
    [
      'Lead or coordinate (Director)',
      'Support with ideas, jokes, or creativity (Joker/Creator)',
    ],
    'MEMBER'
  ),
  multi(
    89,
    'Play Nature: what feels most natural to you? Pick your top 3 (rank 1-3).',
    [
      'Social (with others)',
      'Creative/Maker (making things)',
      'Exploratory (curiosity, discovery)',
      'Movement/Physical',
      'Story/Narrative',
      'Object/Hands-on (tinkering)',
      'Mindful/Reflective',
      'Competitive/Challenge',
      'Imaginative/Role-play',
    ],
    'MEMBER'
  ),
  multi(
    90,
    'Types of Play: what do you enjoy most? Pick your top 3 (rank 1-3).',
    [
      'Social Play',
      'Creative / Maker Play',
      'Exploratory / Curiosity Play',
      'Storytelling / Narrative Play',
      'Object Play',
    ],
    'MEMBER'
  ),
  scale(91, 'Energy preference (1 relaxed - 5 high energy).', 'MEMBER'),
  scale(92, 'Noise preference (1 quiet - 5 loud is fine).', 'MEMBER'),
  scale(
    93,
    'Social intensity preference (1 low-pressure / parallel play - 5 highly interactive).',
    'MEMBER'
  ),
  scale(94, 'Competition preference (1 none - 5 love it).', 'MEMBER'),
  scale(
    95,
    'Spotlight preference (1 avoid spotlight - 5 love spotlight).',
    'MEMBER'
  ),
  scale(
    96,
    "Creative confidence (1 I worry I'm 'not creative' - 5 I love making stuff).",
    'MEMBER'
  ),
  scale(
    97,
    'Openness to trying new things (1 stay safe - 5 surprise me).',
    'MEMBER'
  ),
  multi(
    98,
    'Kid-you: what did you love doing most? (select all that apply)',
    [
      'Building LEGO / forts (Object Play)',
      'Drawing / crafts / making things (Creative Play)',
      'Sports / tag / running',
    ],
    'MEMBER'
  ),
  text(
    99,
    'Anything else you loved doing as a kid? (optional)',
    'Type your answer here...',
    250,
    'MEMBER'
  ),
  multi(
    100,
    'Anything you strongly want to avoid? (select all that apply)',
    [
      'Being put on the spot',
      'High competition',
      'Loud noise',
      'Messy materials',
      'Physical contact',
      'Personal sharing',
    ],
    'MEMBER'
  ),
  multi(
    101,
    'Needs-based supports that help you participate (select all that apply).',
    [
      'Clear written + spoken instructions',
      'More time to process',
      'Breaks / step away',
      'Quiet/low-sensory',
    ],
    'MEMBER'
  ),
  text(
    102,
    'Optional: Any accessibility notes we should plan for?',
    'Share any accessibility notes',
    250,
    'MEMBER'
  ),
  single(
    103,
    'Have you taken the Enneagram assessment before?',
    ['Yes', 'No', 'Not sure'],
    'MEMBER'
  ),
  single(
    104,
    'If yes: what is your Enneagram type?',
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Not sure'],
    'MEMBER'
  ),
  single(
    105,
    'If you know it: your wing?',
    [
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
    ],
    'MEMBER'
  ),
  single(
    106,
    'If you know it: your instinct stack?',
    ['sp/sx', 'sp/so', 'sx/so', 'sx/sp', 'so/sp', 'so/sx', 'Not sure'],
    'MEMBER'
  ),
];

const importedQuestionOverrides: SeedQuestion[] = [
  withDimension(
    single(1, 'What is your group activity for?', [
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
    'activity_for'
  ),
  withDimension(
    single(
      2,
      'Which primary objective best describes what you want most from this experience?',
      ['Team Bonding', 'Team Building', 'Team Development', 'Not sure']
    ),
    'objective_category'
  ),
  withDimension(
    text(
      107,
      'Quick definitions: Team Bonding = strengthen relationships/belonging. Team Building = improve how we work together. Team Development = grow skills/mindsets (creativity, problem-solving, resilience).',
      'Informational content only',
      0
    ),
    'team_objective_definitions_info'
  ),
  withDimension(
    multi(3, 'What would make this a success? Pick up to 2 outcomes.', [
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
    'success_criteria'
  ),
  withDimension(
    multi(
      4,
      'Hard constraints (must-have / must-avoid). Select all that apply.',
      [
        'No alcohol',
        'Accessible for mobility needs',
        'Accessible for sensory needs (low noise/low light)',
        'Dietary restrictions must be supported',
        'No physical contact',
        'Virtual or hybrid only',
        'Must be travel-friendly (flying teams)',
      ]
    ),
    'constraints_hard'
  ),
  withDimension(
    multi(
      5,
      "Preferences (we'd like to avoid these if possible). Select all that apply.",
      [
        'Avoid competition',
        'Avoid being put on the spot',
        'Avoid personal sharing/vulnerability',
        'Avoid loud noise',
        'Avoid messy materials',
        'Avoid complex instructions',
        'Keep it low energy',
      ]
    ),
    'constraints_soft'
  ),
  withDimension(
    single(6, 'How strict should we be with your preference constraints?', [
      'Soft preferences (try to match)',
      'Hard filters (do not show if violated)',
    ]),
    'constraint_strictness'
  ),
  withDimension(
    scale(
      7,
      'How important is reflection/debrief in the experience? (1 not important - 5 essential)'
    ),
    'debrief_importance'
  ),
  withDimension(
    multi(
      9,
      'Which statements best describe your team right now? (select all that apply)',
      [
        'New team / new manager',
        'Recently reorganized',
        'Mostly remote / rebuilding',
      ]
    ),
    'team_context'
  ),
  withDimension(
    scale(
      10,
      'Team psychological safety baseline (1 low trust - 5 high trust).'
    ),
    'psych_safety'
  ),
  withDimension(
    scale(
      11,
      'How ready is your team for team-building activities that involve sharing, vulnerability, or personal growth?'
    ),
    'team_readiness'
  ),
  withDimension(
    text(
      13,
      'How many will be remote/virtual (if hybrid)?',
      'Enter the remote count'
    ),
    'remote_count'
  ),
  withDimension(
    single(15, 'How flexible are you on dates?', [
      'Exact date(s) only',
      'Flexible within 1 week',
      'Flexible within 2-4 weeks',
      'Flexible',
    ]),
    'date_flexibility'
  ),
  withDimension(
    single(16, 'Preferred time window', [
      'Morning',
      'Midday/Afternoon',
      'Evening',
      'Any',
    ]),
    'preferred_time'
  ),
  withDimension(
    text(
      17,
      'Do you have a hard deadline to have a proposal in hand? If so, what date/time?',
      'Share the deadline date/time'
    ),
    'proposal_deadline'
  ),
  withDimension(
    single(18, 'How long do you have for the experience?', [
      '<45',
      '45-60',
      '60-90',
      '90-120',
      '120-180',
      '180+',
    ]),
    'duration_bucket'
  ),
  withDimension(
    single(19, 'How many hours are you looking to book? (if you know)', [
      '0.75',
      '1',
      '1.5',
      '2',
      '2.5',
      '3',
      '4',
      '4+',
    ]),
    'book_hours'
  ),
  withDimension(
    multi(20, 'Where do you want this to happen? (select all that apply)', [
      'On-site (Pop CoLab)',
      'Off-site (your location)',
      'Virtual',
      'Hybrid',
    ]),
    'delivery_methods'
  ),
  withDimension(
    text(21, 'City (if off-site)', 'Enter the city'),
    'location_city'
  ),
  withDimension(
    text(
      22,
      'If off-site/hybrid: share address area + venue notes (parking, elevators, room setup)',
      'Share venue details'
    ),
    'location_notes'
  ),
  withDimension(
    single(23, 'What is your estimated budget range (before tax + travel)?', [
      '<$500',
      '$500-$1000',
      '$1000-$2500',
      '$2500-$5000',
      '$5000+',
      'Not sure yet',
    ]),
    'budget_range'
  ),
  withDimension(
    single(24, 'Would you like to be added to our newsletter for updates?', [
      'Yes',
      'No',
    ]),
    'newsletter_option'
  ),
  withDimension(
    multi(25, 'Team objective(s) (select all that apply)', [
      'Strengthen team connections',
      'Spark creativity',
      'Boost morale',
      'Improve communication',
    ]),
    'objectives_support'
  ),
  withDimension(
    multi(26, 'Pick your top 3 goals (rank 1-3).', [
      'Connection & trust',
      'Belonging / team rituals / celebration',
      'Communication & collaboration',
      'Creativity & new ideas',
    ]),
    'success_criteria_definition'
  ),
  withDimension(
    multi(
      27,
      'How will you know this was successful? (select all that apply)',
      [
        'People felt more connected',
        'We have clearer ways of working / norms',
        'We learned something new',
        'Energy / morale improved',
      ]
    ),
    'success_criteria'
  ),
  withDimension(
    multi(28, 'Preferred formats (select all that apply).', [
      'DIY / Make & Take',
      'Games',
      'Trivia',
      'Wellness / Movement',
      'Learning Lab (talk + activity)',
    ]),
    'format_preferences'
  ),
  withDimension(
    text(
      29,
      "What have you tried before (team activities) and what worked / didn't work?",
      'Share what your team has already tried',
      500
    ),
    'previous_activities'
  ),
  withDimension(
    multi(30, 'How do you want it led? (select all that apply)', [
      'Facilitated (host-led)',
      'Mixed (guided + self-led)',
      'Stations / drop-in',
      'Free play (self-led)',
    ]),
    'lead_preferences'
  ),
  withDimension(
    single(31, 'Provider preference?', [
      'Pop CoLab only',
      'Open to Pop CoLab + partners',
      'Open to Pop CoLab + partners + outside vendors',
    ]),
    'provider_preference'
  ),
  withDimension(
    multi(
      32,
      'What kinds of play should show up? Pick your top 3 (rank 1-3).',
      [
        'Social Play',
        'Creative / Maker Play',
        'Exploratory / Curiosity Play',
        'Storytelling / Roleplay',
      ]
    ),
    'play_types'
  ),
  withDimension(
    scale(33, 'Energy preference (1 relaxed - 5 high energy).'),
    'energy_level'
  ),
  withDimension(
    scale(34, 'Movement level (1 mostly seated - 5 lots of movement).'),
    'activity_level'
  ),
  withDimension(
    scale(35, 'Noise tolerance (1 prefer quiet - 5 loud is fine).'),
    'noise_tolerance'
  ),
  withDimension(
    single(36, 'Do you need to keep things quiet?', [
      'No limit',
      'Prefer quiet',
      'Must be quiet',
    ]),
    'quiet_requirement'
  ),
  withDimension(
    scale(
      37,
      'Cognitive load (1 chill + simple - 5 strategic/problem-solving).'
    ),
    'cognitive_load'
  ),
  withDimension(
    scale(
      38,
      'Social intensity (1 low-pressure / parallel - 5 highly interactive).'
    ),
    'social_intensity'
  ),
  withDimension(
    scale(39, 'Competition comfort (1 none - 5 bring the leaderboard).'),
    'competition_level'
  ),
  withDimension(
    scale(40, 'Spotlight comfort (1 no performing - 5 love performing).'),
    'spotlight_level'
  ),
  withDimension(
    scale(41, 'Messiness tolerance (1 keep it clean - 5 mess is fine).'),
    'messiness_level'
  ),
  withDimension(
    scale(
      42,
      "Creative confidence required (1 no art skills please - 5 we're all-in on creating)."
    ),
    'creative_confidence'
  ),
  withDimension(
    scale(
      43,
      'How open is your team to trying something new? (1 stay safe - 5 surprise us)'
    ),
    'openness_surprise'
  ),
  withDimension(
    scale(
      44,
      'How important is neuroinclusive design for this group? (1 standard - 5 very important/access needs)'
    ),
    'neuroinclusive_priority'
  ),
  withDimension(
    multi(45, 'Any mobility/access needs? (select all that apply)', [
      'None',
      'Wheelchair accessible',
      'Avoid stairs',
      'Seated option needed',
      'Frequent breaks',
    ]),
    'accessibility_mobility'
  ),
  withDimension(
    multi(46, 'Any sensory needs we should plan for? (select all that apply)', [
      'None',
      'Quiet space available',
      'Lower noise preferred',
      'Lower scent',
    ]),
    'accessibility_sensory'
  ),
  withDimension(
    multi(47, 'Any hearing access needs? (select all that apply)', [
      'None',
      'Captions (virtual)',
      'Mic/speaker support',
      'Face speakers when talking',
    ]),
    'accessibility_hearing'
  ),
  withDimension(
    multi(48, 'Any vision access needs? (select all that apply)', [
      'None',
      'Large print',
      'High contrast visuals',
      'Verbal instructions',
      'Other',
    ]),
    'accessibility_vision'
  ),
  withDimension(
    single(49, 'Do you want a make-and-take item?', ['Yes', 'No', 'Either']),
    'take_item'
  ),
  withDimension(
    single(50, 'Are people flying / limited for take-home items?', [
      'No',
      'Some are flying',
      'Most are flying',
    ]),
    'travel_flying'
  ),
  withDimension(
    single(51, 'Alcohol policy for your team event?', [
      'No alcohol (zero-proof only)',
      'Alcohol allowed',
      'Not sure',
    ]),
    'alcohol_policy'
  ),
  withDimension(
    multi(
      52,
      'Any dietary considerations? (only affects tasting/food experiences)',
      [
        'None',
        'Vegetarian',
        'Vegan',
        'Gluten-free',
        'Halal',
        'Kosher',
        'Nut allergy',
        'Dairy-free',
      ]
    ),
    'dietary_considerations'
  ),
  withDimension(
    text(
      53,
      'Any theme, brand colours, or company values you want woven in? (optional)',
      'Share any theme, brand, or values notes'
    ),
    'theme_or_branding'
  ),
  withDimension(
    single(54, 'How customized should this be?', [
      'Off-the-shelf',
      'Some customization',
      'Fully customized',
      'Not sure',
    ]),
    'customization_level'
  ),
  withDimension(
    single(55, 'Do you want a debrief/reflection built in?', [
      'No debrief',
      'Light debrief (5-10 min)',
      'Structured debrief (15-20 min)',
    ]),
    'debrief_level'
  ),
  withDimension(
    single(56, 'Do you need a short post-event summary/report?', [
      'No',
      'Nice to have',
      'Yes',
    ]),
    'report_needed'
  ),
  withDimension(
    single(57, 'Language preference for facilitation/materials (optional)', [
      'English',
      'French',
      'Bilingual',
      'Other',
    ]),
    'language_preference'
  ),
  withDimension(
    single(58, "Your team's vibe (optional): what feels right?", [
      'Playful & silly',
      'Warm & conversational',
      'Calm & reflective',
      'Competitive & energetic',
    ]),
    'culture_vibe'
  ),
  withDimension(
    text(
      59,
      'Anything else we should know? (schedule, culture, sensitivities, must-avoid, etc.)',
      'Add any other context',
      500
    ),
    'additional_notes'
  ),
  withDimension(
    single(
      60,
      'When it comes to playful team activities, I usually need...',
      [
        'No support (I jump in)',
        'Light support (a warm-up helps)',
        'A lot of support (I need strong structure + opt-out options)',
      ],
      'MEMBER'
    ),
    'support_category'
  ),
  withDimension(
    scale(
      61,
      'Support need (1 jump in - 5 I need lots of support/structure).',
      'MEMBER'
    ),
    'support_need'
  ),
  withDimension(
    scale(
      62,
      'In group settings at work, I feel psychologically safe to try new things. (1 least like me - 5 most like me)',
      'MEMBER'
    ),
    'psych_safety'
  ),
  withDimension(
    single(
      63,
      "You're at a social event where you don't know anyone. You...",
      [
        'Start mingling with the first person you see',
        'Find someone approachable and start a conversation',
        'Wait until someone comes up to you',
        'Hang back near the food/edge of the room until you feel comfortable',
      ],
      'MEMBER'
    ),
    'social_initiation'
  ),
  withDimension(
    single(
      64,
      'A facilitator invites the group to try something new (slightly awkward). You...',
      [
        'Jump in immediately',
        'Try it after watching 1-2 people',
        'Try it if I can do it with a buddy',
        'Prefer to observe / pass',
      ],
      'MEMBER'
    ),
    'activity_scenario'
  ),
  withDimension(
    single(
      65,
      'If an activity puts me on the spot (performing / sharing in front of everyone), I...',
      [
        'Love it',
        "It's okay sometimes",
        'Prefer small groups',
        'Prefer to avoid spotlight',
      ],
      'MEMBER'
    ),
    'spotlight_scenario'
  ),
  withDimension(
    multi(
      66,
      'What helps you feel comfortable joining in? (select all that apply)',
      [
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
      ],
      'MEMBER'
    ),
    'supports_helpful'
  ),
  withDimension(
    scale(
      67,
      'I prefer activities with clear steps and structure (1 free-flow - 5 very structured).',
      'MEMBER'
    ),
    'structure_pref'
  ),
  withDimension(
    scale(
      68,
      'If I opt out of an activity, I feel comfortable doing so. (1 not comfortable - 5 very comfortable)',
      'MEMBER'
    ),
    'safety_optout'
  ),
  withDimension(
    scale(
      69,
      'Joker: I like humour, surprises, and keeping things light. (1-5)',
      'ASSESS'
    ),
    'person_joker'
  ),
  withDimension(
    scale(
      70,
      'Kinesthete: I like movement, hands-on, and physical engagement. (1-5)',
      'ASSESS'
    ),
    'person_kinesthete'
  ),
  withDimension(
    scale(
      71,
      'Explorer: I like curiosity, trying new things, and discovering. (1-5)',
      'ASSESS'
    ),
    'person_explorer'
  ),
  withDimension(
    scale(
      72,
      'Competitor: I like challenge, goals, and friendly competition. (1-5)',
      'ASSESS'
    ),
    'person_competitor'
  ),
  withDimension(
    scale(
      73,
      'Director: I like organizing people, leading, and shaping the plan. (1-5)',
      'ASSESS'
    ),
    'person_director'
  ),
  withDimension(
    scale(
      74,
      'Collector: I like gathering, sorting, and building connections/knowledge. (1-5)',
      'ASSESS'
    ),
    'person_collector'
  ),
  withDimension(
    scale(
      75,
      'Creator/Artist: I like making, designing, and expressing ideas. (1-5)',
      'ASSESS'
    ),
    'person_creator_artist'
  ),
  withDimension(
    scale(
      76,
      'Storyteller: I like stories, meaning, and sharing experiences. (1-5)',
      'ASSESS'
    ),
    'person_storyteller'
  ),
  withDimension(
    multi(
      89,
      'Play Nature: what feels most natural to you? Pick your top 3 (rank 1-3).',
      [
        'Social (with others)',
        'Creative/Maker (making things)',
        'Exploratory (curiosity, discovery)',
        'Movement/Physical',
        'Story/Narrative',
        'Object/Hands-on (tinkering)',
        'Mindful/Reflective',
        'Competitive/Challenge',
        'Imaginative/Role-play',
      ],
      'ASSESS'
    ),
    'play_nature'
  ),
  withDimension(
    multi(
      90,
      'Types of Play: what do you enjoy most? Pick your top 3 (rank 1-3).',
      [
        'Social Play',
        'Creative / Maker Play',
        'Exploratory / Curiosity Play',
        'Storytelling / Narrative Play',
        'Object Play',
      ],
      'ASSESS'
    ),
    'play_types'
  ),
  withDimension(
    scale(91, 'Energy preference (1 relaxed - 5 high energy).', 'MEMBER'),
    'energy_score'
  ),
  withDimension(
    scale(92, 'Noise preference (1 quiet - 5 loud is fine).', 'MEMBER'),
    'noise_level'
  ),
  withDimension(
    scale(
      93,
      'Social intensity preference (1 low-pressure / parallel play - 5 highly interactive).',
      'MEMBER'
    ),
    'social_intensity'
  ),
  withDimension(
    scale(94, 'Competition preference (1 none - 5 love it).', 'MEMBER'),
    'competition_level'
  ),
  withDimension(
    scale(
      95,
      'Spotlight preference (1 avoid spotlight - 5 love spotlight).',
      'MEMBER'
    ),
    'spotlight_level'
  ),
  withDimension(
    scale(
      96,
      "Creative confidence (1 I worry I'm 'not creative' - 5 I love making stuff).",
      'MEMBER'
    ),
    'creative_confidence'
  ),
  withDimension(
    scale(
      97,
      'Openness to trying new things (1 stay safe - 5 surprise me).',
      'MEMBER'
    ),
    'openness_new'
  ),
  withDimension(
    multi(
      98,
      'Kid-you: what did you love doing most? (select all that apply)',
      [
        'Building LEGO / forts (Object Play)',
        'Drawing / crafts / making things (Creative Play)',
        'Sports / tag / running',
      ],
      'MEMBER'
    ),
    'childhood_play'
  ),
  withDimension(
    text(
      99,
      'Anything else you loved doing as a kid? (optional)',
      'Type your answer here...',
      250,
      'MEMBER'
    ),
    'childhood_open'
  ),
  withDimension(
    multi(
      100,
      'Anything you strongly want to avoid? (select all that apply)',
      [
        'Being put on the spot',
        'High competition',
        'Loud noise',
        'Messy materials',
        'Physical contact',
        'Personal sharing',
      ],
      'MEMBER'
    ),
    'avoid_elements'
  ),
  withDimension(
    multi(
      101,
      'Needs-based supports that help you participate (select all that apply).',
      [
        'Clear written + spoken instructions',
        'More time to process',
        'Breaks / step away',
        'Quiet/low-sensory',
      ],
      'MEMBER'
    ),
    'neuro_supports'
  ),
  withDimension(
    text(
      102,
      'Optional: Any accessibility notes we should plan for?',
      'Share any accessibility notes',
      250,
      'MEMBER'
    ),
    'accessibility_notes'
  ),
  withDimension(
    single(
      103,
      'Have you taken the Enneagram assessment before?',
      ['Yes', 'No', 'Not sure'],
      'MEMBER'
    ),
    'enneagram_taken'
  ),
  withDimension(
    single(
      104,
      'If yes: what is your Enneagram type?',
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Not sure'],
      'MEMBER'
    ),
    'enneagram_type'
  ),
  withDimension(
    single(
      105,
      'If you know it: your wing?',
      [
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
      ],
      'MEMBER'
    ),
    'enneagram_wing'
  ),
  withDimension(
    single(
      106,
      'If you know it: your instinct stack?',
      ['sp/sx', 'sp/so', 'sx/so', 'sx/sp', 'so/sp', 'so/sx', 'Not sure'],
      'MEMBER'
    ),
    'enneagram_instinct'
  ),
];

const questions = mergeQuestionsByText([
  ...baseQuestions,
  ...importedQuestionOverrides,
]);

export async function seedQuestions(
  prisma: PrismaClient,
  schemaState: Pick<
    SeedSchemaState,
    'hasFormQuestionTable' | 'hasFormDimensionTable' | 'hasIntakeFormTable'
  >
): Promise<QuestionIdByOrder> {
  if (schemaState.hasFormQuestionTable) {
    await prisma.$executeRaw`DELETE FROM "form_question"`;
    console.log('Cleared existing form_question mappings');
  }
  if (schemaState.hasFormDimensionTable) {
    await prisma.$executeRaw`DELETE FROM "form_dimension"`;
    console.log('Cleared existing form_dimension mappings');
  }
  if (schemaState.hasIntakeFormTable) {
    await prisma.$executeRaw`DELETE FROM "intake_form"`;
    console.log('Cleared existing intake forms');
  }

  await prisma.requestPreference.deleteMany({});
  await prisma.questionDimension.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  console.log('Cleared existing questions');

  for (const question of questions) {
    const { options, dimension_key, ...questionData } = question;
    void dimension_key;
    await prisma.question.create({
      data: {
        ...questionData,
        question_options: {
          create: options.map(option => ({
            option_label: option.option_label,
            option_value: option.option_value,
            option_score: option.option_score ?? null,
          })),
        },
      },
    });
    console.log(
      `Created question [${questionData.question_type}]: ${questionData.question_text.slice(0, 50)}...`
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
  for (const question of questions) {
    if (!question.dimension_key) {
      continue;
    }

    const questionId = questionIdByOrder.get(question.order_index);
    if (!questionId) {
      console.warn(`No question with order_index ${question.order_index}`);
      continue;
    }

    const dimensionId = dimensionIdByKey.get(question.dimension_key);
    if (!dimensionId) {
      console.warn(`No dimension with key ${question.dimension_key}`);
      continue;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { dimension_id: dimensionId },
    });

    await prisma.questionDimension.create({
      data: {
        question_id: questionId,
        dimension_id: dimensionId,
        weight_rate: 1,
      },
    });

    console.log(`Wired ${question.dimension_key} -> Q#${question.order_index}`);
  }
}
