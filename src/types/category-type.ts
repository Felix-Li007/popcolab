export type ExperienceCategory = {
  id: number;
  title: string;
  notes: string | null;
  status: string;
  parentId: number | null;
  parentTitle: string | null;
  childCount: number;
  linkedExperienceCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ExperienceCategoryTreeNode = ExperienceCategory & {
  children: ExperienceCategoryTreeNode[];
};

export type ExperienceCategoryOption = {
  id: number;
  label: string;
  depth: number;
};

export type ExperienceCategoryFormState = {
  errors: {
    title?: string;
    notes?: string;
    status?: string;
    parentId?: string;
    _form?: string;
  };
  success?: boolean;
};
