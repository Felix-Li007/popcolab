import type { UserStatus } from '@/constants/user-status';
import type { WorkMode } from '@/constants/work-mode';

export type { UserStatus };

export type AdminUsersStatusFilter = 'all' | UserStatus;

export type AdminUserListItem = {
  id: number;
  email: string;
  userName: string;
  avatarImage: string | null;
  status: UserStatus;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  preferredContact: string | null;
  consentGiven: boolean | null;
  privacyNotes: string | null;
  corporateName: string | null;
  departmentName: string | null;
  roleTitle: string | null;
  workMode: WorkMode | null;
  teamCount: number;
  teamNames: string[];
  requestCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserEditableUpdateInput = {
  userName: string;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  preferredContact: string | null;
  corporateName: string | null;
  departmentName: string | null;
  roleTitle: string | null;
  workMode: WorkMode | null;
};

export type AdminUserEditableUpdateErrors = Partial<
  Record<keyof AdminUserEditableUpdateInput | '_form', string>
>;

export type AdminUserStatusCounts = Record<UserStatus, number>;

export type AdminUsersPageQuery = {
  search: string;
  status: AdminUsersStatusFilter;
  page: number;
  pageSize: number;
};

export type AdminUsersPageData = {
  items: AdminUserListItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  statusCounts: AdminUserStatusCounts;
};
