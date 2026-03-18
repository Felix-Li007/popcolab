export const EXPERIENCE_DIMENSION_COLUMN_TO_KEY: Record<string, string> = {
  lead_type: 'lead_preferences',
  delivery_methods: 'delivery_methods',
  dietary_considerations: 'dietary_considerations',
  take_item: 'take_item',
  travel_flying: 'travel_flying',
  play_natures: 'play_nature',
  play_types: 'play_types',
  objectives_supported: 'objectives_supported',
  neurodivergent_inclusive: 'neurodivergent_inclusive',
  neurotypical_general: 'neurotypical_general',
  energy_lelve: 'energy_level',
  activity_level: 'activity_level',
  noise_level: 'noise_level',
  cognitive_load: 'cognitive_load',
  social_intensity: 'social_intensity',
  competition_level: 'competition_level',
  spotlight_level: 'spotlight_level',
  messiness_level: 'messiness_level',
  creative_confidence: 'creative_confidence',
  person_joker: 'person_joker',
  person_kinesthete: 'person_kinesthete',
  person_explorer: 'person_explorer',
  person_competitor: 'person_competitor',
  person_director: 'person_director',
  person_collector: 'person_collector',
  person_creator_artist: 'person_creator_artist',
  person_storyteller: 'person_storyteller',
};

export const EXPERIENCE_DIMENSION_KEYS = Array.from(
  new Set(Object.values(EXPERIENCE_DIMENSION_COLUMN_TO_KEY))
);
