export type IntakeFormStatus = 0 | 1;

export type IntakeForm = {
  id?: number;
  name: string;
  description: string;
  formType: string;
  status: IntakeFormStatus;
  createdBy: number;
  createdByUserName?: string;
  questionIds: number[];
  questionCount: number;
  dimensionIds: number[];
  dimensionCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type IntakeQuestionOption = {
  id: number;
  text: string;
  dimensionIds: number[];
};

export type IntakeDimensionOption = {
  id: number;
  indexName: string;
  indexKey: string | null;
  categoryName: string;
};

export type IntakeFormFormState = {
  errors: {
    name?: string;
    description?: string;
    formType?: string;
    status?: string;
    questions?: string;
    _form?: string;
  };
  success?: boolean;
};
