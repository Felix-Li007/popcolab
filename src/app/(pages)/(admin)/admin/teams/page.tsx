import { redirect } from 'next/navigation';

export default function LegacyTeamsPage() {
  redirect('/admin/users/teams');
}
