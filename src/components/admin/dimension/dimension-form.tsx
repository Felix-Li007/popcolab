'use client';

import { createPortal } from 'react-dom';
import type {
  Dimension,
  DimensionCategory,
  DimensionFormState,
} from '@/types/dimension-type';
import DimensionPanel from '@/components/admin/dimension/dimension-panel';
import styles from '@/styles/dimension-form.module.css';

type FormAction = (
  prevState: DimensionFormState,
  formData: FormData
) => Promise<DimensionFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: Dimension;
  categories: DimensionCategory[];
  onSuccess: () => void;
};

export default function DimensionForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  categories,
  onSuccess,
}: Props) {
  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div onClick={onClose} className={styles.backdrop} />
      <div
        className={styles.wideCard}
        style={{ width: 'min(39rem, calc(100vw - 2rem))' }}
      >
        <DimensionPanel
          action={action}
          isEdit={isEdit}
          initial={initial}
          categories={categories}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </div>
    </>,
    document.body
  );
}
