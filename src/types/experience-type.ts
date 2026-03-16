import type { DimensionOption } from '@/types/dimension-type';

export type ExperienceDimensionValue = {
  dimensionId: number;
  indexKey: string | null;
  indexName: string;
  categoryName: string;
  dataType: string;
  scaleMin?: number | null;
  scaleMax?: number | null;
  options: DimensionOption[];
  expectedValue: string | null;
};

export type Experience = {
  id: number;
  providerId: number;
  providerLabel: string;
  providerType: string;
  categoryId: number;
  categoryTitle: string;
  experienceTitle: string;
  popularityIndex: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  leadType: string;
  deliveryMethods: string;
  dietaryConsiderations?: string | null;
  takeItem?: number | null;
  travelFlying?: number | null;
  createdBy: number;
  dimensionCount: number;
  proposalCount: number;
  calendarCount: number;
  dimensionValues: ExperienceDimensionValue[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type ExperienceFormState = {
  errors: {
    experienceTitle?: string;
    providerId?: string;
    categoryId?: string;
    popularityIndex?: string;
    durationMin?: string;
    durationMax?: string;
    capacityMax?: string;
    leadType?: string;
    deliveryMethods?: string;
    dietaryConsiderations?: string;
    takeItem?: string;
    travelFlying?: string;
    dimensions?: string;
    _form?: string;
  };
  success?: boolean;
};
