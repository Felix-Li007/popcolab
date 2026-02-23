export type PersonalityTypeStyle = {
  bg: string;
  text: string;
  border: string;
  orb: string;
  glow: string;
};

export const PERSONALITY_TYPE_STYLES: Record<string, PersonalityTypeStyle> = {
  JOKER: {
    bg: 'bg-teal-deep',
    text: 'text-white',
    border: 'border-teal-deep',
    orb: '#d0e9eb',
    glow: 'rgba(25,70,77,0.35)',
  },
  KINESTHETE: {
    bg: 'bg-magenta',
    text: 'text-white',
    border: 'border-magenta',
    orb: '#fde0ef',
    glow: 'rgba(245,46,129,0.35)',
  },
  EXPLORER: {
    bg: 'bg-brand-yellow',
    text: 'text-gray-800',
    border: 'border-brand-yellow',
    orb: '#fdf7d0',
    glow: 'rgba(245,221,66,0.45)',
  },
  COMPETITOR: {
    bg: 'bg-pink-bright',
    text: 'text-gray-800',
    border: 'border-pink-bright',
    orb: '#ffe6fb',
    glow: 'rgba(255,141,230,0.45)',
  },
  COLLECTOR: {
    bg: 'bg-pink-medium',
    text: 'text-gray-800',
    border: 'border-pink-medium',
    orb: '#ffedfb',
    glow: 'rgba(255,164,235,0.45)',
  },
  CREATOR: {
    bg: 'bg-coral-vibe',
    text: 'text-white',
    border: 'border-coral-vibe',
    orb: '#fde4e3',
    glow: 'rgba(228,82,74,0.35)',
  },
  DIRECTOR: {
    bg: 'bg-teal-accent',
    text: 'text-white',
    border: 'border-teal-accent',
    orb: '#ddedf0',
    glow: 'rgba(59,107,119,0.35)',
  },
  STORYTELLER: {
    bg: 'bg-coral-red',
    text: 'text-white',
    border: 'border-coral-red',
    orb: '#fde8e7',
    glow: 'rgba(233,117,110,0.4)',
  },
};

export const DEFAULT_PERSONALITY_STYLE: PersonalityTypeStyle = {
  bg: 'bg-gray-200',
  text: 'text-gray-800',
  border: 'border-gray-200',
  orb: '#ede9fe',
  glow: 'rgba(0,0,0,0.15)',
};

export function getPersonalityStyle(type: string): PersonalityTypeStyle {
  return PERSONALITY_TYPE_STYLES[type] ?? DEFAULT_PERSONALITY_STYLE;
}
