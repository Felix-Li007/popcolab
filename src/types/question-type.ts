export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'scale'
  | 'text_input';

export { FormName as FORM_NAME } from '@/libs/prisma/enums';
export type { FormName } from '@/libs/prisma/enums';

export type QuestionOption = {
  id?: number;
  label: string;
  value: string;
  score?: number | null;
};

export type QuestionDimension = {
  id?: number;
  dimensionId: number;
  dimensionName: string;
  categoryName: string;
  indexKey?: string | null;
  weight: number | null;
};

export type DimensionOption = {
  id?: number;
  label: string;
  value: string;
};

export type DimensionIndex = {
  id: number;
  indexKey?: string | null;
  indexName: string;
  categoryId: number;
  categoryName: string;
  dataType: string;
  hardFilter: boolean;
  scaleMin?: number | null;
  scaleMax?: number | null;
  options: DimensionOption[];
};

export type Question = {
  id?: number;
  formName: FormName;
  type: QuestionType;
  text: string;
  description: string;
  orderIndex?: number | null;
  options: QuestionOption[];
  dimensions: QuestionDimension[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type QuestionFormState = {
  errors: {
    text?: string;
    type?: string;
    options?: string;
    dimensions?: string;
    _form?: string;
  };
  success?: boolean;
};
