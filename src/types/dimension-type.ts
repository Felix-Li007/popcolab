export type DimensionDataType = 'numeric' | 'scale' | 'text';

export type DimensionCategory = {
  id: number;
  name: string;
  description?: string | null;
};

export type DimensionOption = {
  id?: number;
  value: string;
};

export type Dimension = {
  id?: number;
  indexKey?: string | null;
  indexName: string;
  indexNotes?: string | null;
  categoryId: number;
  categoryName: string;
  dataType: DimensionDataType | string;
  hardFilter: boolean;
  scaleMin?: number | null;
  scaleMax?: number | null;
  options: DimensionOption[];
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
