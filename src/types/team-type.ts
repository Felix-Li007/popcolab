export type AdminTeamListItem = {
  id: number;
  name: string;
  description: string | null;
  ownerEmail: string;
  memberCount: number;
};

export type AdminTeamMember = {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

export type AdminTeamCardItem = AdminTeamListItem & {
  members: AdminTeamMember[];
};

export type AdminTeamsPageQuery = {
  search: string;
  page: number;
  pageSize: number;
};

export type AdminTeamsPageData = {
  search: string;
  items: AdminTeamCardItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
};
