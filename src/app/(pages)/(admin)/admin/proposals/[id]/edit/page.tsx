import { notFound } from 'next/navigation';
import ProposalEditForm from '@/components/admin/proposal/proposal-edit';
import { getAdminProposalById } from '@/services/proposal-service';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminProposalEditPage({
  params,
}: Readonly<Props>) {
  const resolvedParams = await params;
  const proposalId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(proposalId)) {
    notFound();
  }

  const proposal = await getAdminProposalById(proposalId);
  if (!proposal) {
    notFound();
  }

  return <ProposalEditForm proposal={proposal} />;
}
