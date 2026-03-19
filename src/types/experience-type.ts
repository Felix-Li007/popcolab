import type { DimensionOption } from '@/types/dimension-type';

export type ExperienceStatus = 'draft' | 'inactive' | 'active';

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

export type ExperiencePricing = {
  startingPrice: number | null;
  addingPrice: number | null;
  startingHour: number | null;
  pricingModel: string | null;
  pricingNotes: string | null;
};

export type Experience = {
  id: number;
  providerId: number;
  providerLabel: string;
  providerType: string;
  categoryId: number;
  categoryTitle: string;
  experienceTitle: string;
  experienceStatus: ExperienceStatus;
  popularityIndex: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  leadType: string;
  deliveryMethods: string;
  pricing: ExperiencePricing;
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
    experienceStatus?: string;
    providerId?: string;
    categoryId?: string;
    durationMin?: string;
    durationMax?: string;
    capacityMax?: string;
    startingPrice?: string;
    addingPrice?: string;
    startingHour?: string;
    pricingModel?: string;
    pricingNotes?: string;
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
