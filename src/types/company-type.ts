import type { WorkMode } from '@/constants/work-mode';

export type CompanyInfo = {
  corporateName: string | null;
  departmentName: string | null;
  roleTitle: string | null;
  workMode: WorkMode | null;
};
