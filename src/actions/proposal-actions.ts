'use server';

import { revalidatePath } from 'next/cache';
import { approveAdminProposal } from '@/services/proposal-service';
import {
  addExperienceToProposal,
  listProposalExperienceCandidatesPage,
  listProposalExperienceCandidates,
  removeExperienceFromProposal,
  searchProposalExperienceCandidates,
} from '@/services/proposal-service';
import { createFittedProposal } from '@/services/proposal-service';
import { deleteAdminProposal } from '@/services/proposal-service';
import { updateAdminProposal } from '@/services/proposal-service';
import { REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';
import type { ProposalEditState } from '@/types/proposal-type';

export type GenerateProposalActionResult = {
  ok: boolean;
  created: boolean;
  message: string;
};

export async function generateProposalForRequestAction(
  requestId: number
): Promise<GenerateProposalActionResult> {
  try {
    const result = await createFittedProposal({
      requestId,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
      queuedAt: new Date().toISOString(),
    });

    revalidatePath('/admin/requests');
    revalidatePath('/admin/proposals');

    if (!result.created) {
      if (result.reason === 'active_proposal_exists') {
        return {
          ok: true,
          created: false,
          message: 'Active proposal already exists for this request.',
        };
      }

      if (result.reason === 'no_recommendations') {
        return {
          ok: true,
          created: false,
          message: 'No recommendations found, so no proposal was generated.',
        };
      }

      return {
        ok: true,
        created: false,
        message: 'No proposal was generated.',
      };
    }

    return {
      ok: true,
      created: true,
      message: 'Proposal generated successfully.',
    };
  } catch (error) {
    return {
      ok: false,
      created: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to generate proposal. Please try again.',
    };
  }
}

export async function updateAdminProposalAction(
  proposalId: number,
  _prev: ProposalEditState,
  formData: FormData
): Promise<ProposalEditState> {
  const status = String(formData.get('status') ?? '')
    .trim()
    .toLowerCase();
  const objectiveAlignment = String(formData.get('objectiveAlignment') ?? '');
  const rationale = String(formData.get('rationale') ?? '');
  const baseScoreRaw = String(formData.get('baseScore') ?? '').trim();
  const riskAdjustmentRaw = String(formData.get('riskAdjustment') ?? '').trim();

  const baseScore = Number(baseScoreRaw);
  const riskAdjustment = Number(riskAdjustmentRaw);

  const result = await updateAdminProposal(proposalId, {
    status: status as 'pending' | 'approved' | 'accepted' | 'rejected',
    objectiveAlignment,
    rationale,
    baseScore,
    riskAdjustment,
  });

  if (!result.success) {
    return {
      success: false,
      fieldErrors: result.fieldErrors,
      error: 'Please fix the highlighted fields.',
    };
  }

  revalidatePath('/admin/proposals');
  revalidatePath(`/admin/proposals/${proposalId}/edit`);
  revalidatePath('/admin/requests');

  return {
    success: true,
  };
}

export async function deleteAdminProposalAction(
  proposalId: number
): Promise<{ ok: boolean; message: string }> {
  const result = await deleteAdminProposal(proposalId);

  if (!result.success) {
    return {
      ok: false,
      message: result.message ?? 'Failed to delete proposal.',
    };
  }

  revalidatePath('/admin/proposals');
  revalidatePath('/admin/requests');

  return {
    ok: true,
    message: 'Proposal deleted successfully.',
  };
}

export async function approveAdminProposalAction(
  proposalId: number
): Promise<{ ok: boolean; message: string }> {
  const result = await approveAdminProposal(proposalId);

  if (!result.success) {
    return {
      ok: false,
      message: result.message ?? 'Failed to approve proposal.',
    };
  }

  revalidatePath('/admin/proposals');
  revalidatePath('/admin/requests');
  revalidatePath('/dashboard/requests');

  return {
    ok: true,
    message: result.message ?? 'Proposal approved successfully.',
  };
}

export async function searchProposalExperienceCandidatesAction(
  proposalId: number,
  keyword: string
) {
  return searchProposalExperienceCandidates(proposalId, keyword);
}

export async function listProposalExperienceCandidatesAction(
  proposalId: number
) {
  return listProposalExperienceCandidates(proposalId);
}

export async function listProposalExperienceCandidatesPageAction(
  proposalId: number,
  keyword: string,
  page: number,
  pageSize: number
) {
  return listProposalExperienceCandidatesPage(
    proposalId,
    keyword,
    page,
    pageSize
  );
}

export async function addExperienceToProposalAction(
  proposalId: number,
  experienceId: number,
  rationale: string
): Promise<{ ok: boolean; message: string }> {
  const result = await addExperienceToProposal(
    proposalId,
    experienceId,
    rationale
  );

  if (!result.success) {
    return {
      ok: false,
      message: result.message ?? 'Failed to add experience to proposal.',
    };
  }

  revalidatePath('/admin/proposals');
  revalidatePath(`/admin/proposals/${proposalId}/edit`);
  revalidatePath('/admin/requests');

  return {
    ok: true,
    message: 'Experience added to proposal successfully.',
  };
}

export async function removeExperienceFromProposalAction(
  proposalId: number,
  experienceId: number
): Promise<{ ok: boolean; message: string }> {
  const result = await removeExperienceFromProposal(proposalId, experienceId);

  if (!result.success) {
    return {
      ok: false,
      message: result.message ?? 'Failed to remove experience from proposal.',
    };
  }

  revalidatePath('/admin/proposals');
  revalidatePath(`/admin/proposals/${proposalId}/edit`);
  revalidatePath('/admin/requests');

  return {
    ok: true,
    message: 'Experience removed from proposal successfully.',
  };
}
