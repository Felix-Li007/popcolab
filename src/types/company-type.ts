import type { WorkMode } from '@/constants/work-mode';

export type CompanyInfo = {
  companyName: string | null;
  departmentName: string | null;
  roleTitle: string | null;
  workMode: WorkMode | null;
  companySize: number | null;
  companyWebsite: string | null;
  id?: number | null;
  userId?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};
