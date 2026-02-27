'use client';

import { createPortal } from 'react-dom';
import type {
  DimensionCategory,
  DimensionCategoryFormState,
} from '@/types/dimension-type';
import DimensionCategoryPanel from '@/components/admin/dimension/category-panel';
import styles from '@/styles/category-form.module.css';

type FormAction = (
  prevState: DimensionCategoryFormState,
  formData: FormData
) => Promise<DimensionCategoryFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: DimensionCategory;
  usageCount?: number;
  onSuccess: () => void;
};

export default function DimensionCategoryForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  usageCount = 0,
  onSuccess,
}: Props) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div onClick={onClose} className={styles.backdrop} />
      <div className={styles.card}>
        <DimensionCategoryPanel
          action={action}
          isEdit={isEdit}
          initial={initial}
          usageCount={usageCount}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </div>
    </>,
    document.body
  );
}
