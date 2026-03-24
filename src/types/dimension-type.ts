import type { IntakeForm } from '@/types/question-type';

export const DIMENSION_DATA_TYPES = {
  NUMERIC: 'numeric',
  SCALE: 'scale',
  TEXT: 'text',
} as const;

export type DimensionDataType =
  (typeof DIMENSION_DATA_TYPES)[keyof typeof DIMENSION_DATA_TYPES];

export type DimensionCategory = {
  id: number;
  name: string;
  description?: string | null;
};

export type DimensionOption = {
  id?: number;
  label: string;
  value: string;
};

export type Dimension = {
  id?: number;
  indexKey?: string | null;
  indexName: string;
  indexNotes?: string | null;
  categoryId: number;
  categoryName: string;
  dataType: string;
  hardFilter: boolean;
  scaleMin?: number | null;
  scaleMax?: number | null;
  options: DimensionOption[];
  formNames: IntakeForm[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type DimensionFormState = {
  errors: {
    indexKey?: string;
    indexName?: string;
    categoryId?: string;
    dataType?: string;
    scaleMin?: string;
    scaleMax?: string;
    options?: string;
    _form?: string;
  };
  success?: boolean;
};

export type DimensionCategoryFormState = {
  errors: {
    name?: string;
    description?: string;
    _form?: string;
  };
  success?: boolean;
};
