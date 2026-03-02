type TeamMemberIdentity = {
  name?: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function normalizeNamePart(value: string | null): string {
  return value && value.trim().length > 0 ? value.trim() : '—';
}

export function getTeamMemberAvatarText(member: TeamMemberIdentity): string {
  const initials = [member.firstName, member.lastName]
    .filter(Boolean)
    .map(part => part!.slice(0, 1).toUpperCase())
    .join('');
  if (initials.length > 0) return initials.slice(0, 2);
  return member.email.slice(0, 1).toUpperCase() || '?';
}

export function getTeamMemberNameLine(member: TeamMemberIdentity): string {
  const hasFirstName = !!member.firstName?.trim();
  const hasLastName = !!member.lastName?.trim();
  const displayName = member.name?.trim();

  if (hasFirstName && hasLastName) {
    return `${normalizeNamePart(member.firstName)}, ${normalizeNamePart(member.lastName)}`;
  }

  if (displayName && displayName.length > 0) return displayName;

  return `${normalizeNamePart(member.firstName)}, ${normalizeNamePart(member.lastName)}`;
}
