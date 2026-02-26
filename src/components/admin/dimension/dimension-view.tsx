'use client';

import { createPortal } from 'react-dom';
import { Badge, Button } from '@/ui';
import type { Dimension } from '@/types/dimension-type';
import styles from '@/styles/dimension-view.module.css';

type Props = {
  isOpen: boolean;
  dimension: Dimension | null;
  onClose: () => void;
  onEdit: (id: number) => void;
};

export default function DimensionView({
  isOpen,
  dimension,
  onClose,
  onEdit,
}: Props) {
  if (!isOpen || !dimension || typeof window === 'undefined') return null;
  const createdDate = dimension.createdAt
    ? new Date(dimension.createdAt).toLocaleDateString('en-US')
    : '-';
  const updatedDate = dimension.updatedAt
    ? new Date(dimension.updatedAt).toLocaleDateString('en-US')
    : '-';

  return createPortal(
    <>
      <div onClick={onClose} className={styles.backdrop} />

      <div className={styles.modal}>
        <div
          className={`px-6 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 flex items-center justify-between ${styles.header}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-display leading-none">📐</span>
            <div>
              <h2 className="text-title font-bold text-foreground leading-tight">
                {dimension.indexName}
              </h2>
              <p className="text-body text-foreground/65 mt-0.5">
                {dimension.indexKey ?? 'NO_KEY'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="icon"
            size="sm"
            title="Close"
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </div>

        <div
          className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 ${styles.scrollArea}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
                Category
              </p>
              <Badge variant="default" size="sm">
                {dimension.categoryName}
              </Badge>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
                Data Type
              </p>
              <Badge
                variant={dimension.dataType === 'scale' ? 'info' : 'secondary'}
                size="sm"
              >
                {dimension.dataType}
              </Badge>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
                Filter Mode
              </p>
              <Badge
                variant={dimension.hardFilter ? 'success' : 'default'}
                size="sm"
              >
                {dimension.hardFilter ? 'Hard Filter' : 'Soft Filter'}
              </Badge>
            </div>
          </div>

          {dimension.indexNotes && (
            <div>
              <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-body text-foreground/80">
                {dimension.indexNotes}
              </p>
            </div>
          )}

          {dimension.dataType === 'scale' && (
            <div>
              <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
                Scale Range
              </p>
              <p className="text-heading font-semibold text-foreground/80">
                {dimension.scaleMin ?? '-'} to {dimension.scaleMax ?? '-'}
              </p>
            </div>
          )}

          {dimension.options.length > 0 && (
            <div>
              <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-2">
                ALLOWED VALUE ({dimension.options.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dimension.options.map((option, idx) => (
                  <Badge key={idx} variant="secondary" size="xs">
                    {option.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-caption text-foreground/50">
            <span>Created: {createdDate}</span>
            <span>Updated: {updatedDate}</span>
          </div>
        </div>

        <div
          className={`px-6 border-t border-gray-100 flex gap-3 ${styles.footer}`}
        >
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={styles.btnClose}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className={styles.btnEdit}
            onClick={() => {
              if (dimension.id) onEdit(dimension.id);
            }}
          >
            Edit
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}
