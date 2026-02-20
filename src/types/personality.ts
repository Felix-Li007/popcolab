export type PersonalityType =
  | 'JOKER'
  | 'KINESTHETE'
  | 'EXPLORER'
  | 'COMPETITOR'
  | 'COLLECTOR'
  | string;

export type PersonalityData = {
  id?: number;
  type: string;
  name: string;
  description: string;
  emoji: string;
  stars: number;
  status: 'active' | 'draft';
  accentColor?: string;
  threshold: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PersonalityFormState = {
  errors: {
    name?: string;
    type?: string;
    description?: string;
    threshold?: string;
    _form?: string;
  };
  success?: boolean;
};
