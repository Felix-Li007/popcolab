'use client';

import { useState, useTransition } from 'react';
import type {
  DeletePersonalityActionFn,
  Personality,
  PersonalityActionHandlers,
  PersonalityFormAction,
} from '@/types/personality-type';

export type ModalState = { open: boolean; id?: number };

type UsePersonalityActions = {
  createPersonalityAction: PersonalityActionHandlers['createPersonalityAction'];
  updatePersonalityAction: PersonalityActionHandlers['updatePersonalityAction'];
  deletePersonalityAction: DeletePersonalityActionFn;
};

export function usePersonality(
  personalities: Personality[],
  {
    createPersonalityAction,
    updatePersonalityAction,
    deletePersonalityAction,
  }: UsePersonalityActions
) {
  const [, startDeleteTransition] = useTransition();
  const [formModal, setFormModal] = useState<ModalState>({ open: false });
  const [viewModal, setViewModal] = useState<ModalState>({ open: false });

  function openCreate() {
    setFormModal({ open: true });
  }

  function openEdit(id: number) {
    setViewModal({ open: false });
    setFormModal({ open: true, id });
  }

  function openView(id: number) {
    setViewModal({ open: true, id });
  }

  function closeForm() {
    setFormModal({ open: false });
  }

  function closeView() {
    setViewModal({ open: false });
  }

  function handleDelete(id: number, name: string, onSuccess?: () => void) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
      )
    )
      return;
    startDeleteTransition(async () => {
      try {
        await deletePersonalityAction(id);
        setViewModal({ open: false });
        onSuccess?.();
      } catch {
        alert('Failed to delete personality. Please try again.');
      }
    });
  }

  const formAction: PersonalityFormAction =
    formModal.id !== undefined
      ? updatePersonalityAction.bind(null, formModal.id)
      : createPersonalityAction;

  const selectedPersonality =
    formModal.id !== undefined
      ? personalities.find(p => p.id === formModal.id)
      : undefined;

  const viewedPersonality =
    viewModal.id !== undefined
      ? personalities.find(p => p.id === viewModal.id)
      : undefined;

  return {
    formModal,
    viewModal,
    openCreate,
    openEdit,
    openView,
    closeForm,
    closeView,
    handleDelete,
    formAction,
    selectedPersonality,
    viewedPersonality,
  };
}
