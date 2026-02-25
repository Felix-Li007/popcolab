export type Personality = {
  id?: number;
  type: string;
  name: string;
  description: string;
  emoji: string;
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
