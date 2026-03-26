import type {
  ExperienceStatus,
  ExperiencePricing,
} from '@/types/experience-type';

export type DashboardExperienceCardData = {
  id: number;
  experienceTitle: string;
  categoryTitle: string;
  experienceStatus: ExperienceStatus;
  providerLabel: string;
  providerType: string;
  popularityIndex: number;
  leadType: string;
  deliveryMethods: string;
  capacityMax: number;
  pricing: ExperiencePricing;
  durationMin: number;
  durationMax: number;
  images: DashboardExperienceImage[];
  imageUrl?: string;
  imageAlt?: string;
  imageNotes?: string;
  createdAt?: string;
};

export type DashboardExperienceImage = {
  imageUrl: string;
  imageAlt?: string | null;
  imageNotes?: string | null;
  isCover: boolean;
};

export type DashboardExperiencesResponse = {
  personality: unknown;
  experiences: DashboardExperienceCardData[];
  allExperiences: DashboardExperienceCardData[];
};
