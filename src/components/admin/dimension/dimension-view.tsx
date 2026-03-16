'use client';

import ModalShell from '@/components/shared/modal-shell';
import { Badge, Button } from '@/ui';
import type { Dimension } from '@/types/dimension-type';
import styles from '@/styles/admin/dimensions/dimension-view.module.css';

type Props = {
  isOpen: boolean;
  dimension: Dimension | null;
  onClose: () => void;
  onEdit: (id: number) => void;
};

const INTAKE_FORM_LABELS: Record<Dimension['formNames'][number], string> = {
  REQUEST: 'LEADER',
  USER: 'MEMBER',
  PLAY: 'ASSESS',
};

export default function DimensionView({
  isOpen,
  dimension,
  onClose,
  onEdit,
}: Props) {
  if (!isOpen || !dimension) return null;
  const createdDate = dimension.createdAt
    ? new Date(dimension.createdAt).toLocaleDateString('en-US')
    : '-';
  const updatedDate = dimension.updatedAt
    ? new Date(dimension.updatedAt).toLocaleDateString('en-US')
    : '-';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-display leading-none">📐</span>
          <span className="truncate">{dimension.indexName}</span>
        </div>
      }
      subtitle={dimension.indexKey ?? 'NO_KEY'}
      panelClassName={styles.panel}
      bodyClassName={styles.scrollArea}
      rootTestId="dimension-view-modal-root"
      panelTestId="dimension-view-modal"
    >
      <div className="space-y-5 px-1 py-1">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
            Category
          </p>
          <Badge variant="default" size="sm">
            {dimension.categoryName}
          </Badge>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-2">
            Forms
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dimension.formNames.length > 0 ? (
              dimension.formNames.map(formName => (
                <Badge key={formName} variant="secondary" size="xs">
                  {INTAKE_FORM_LABELS[formName]}
                </Badge>
              ))
            ) : (
              <span className="text-body text-foreground/50 italic">
                No forms linked.
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-badge font-bold text-foreground/45 uppercase tracking-wide mb-1">
            Notes
          </p>
          <p className="text-body whitespace-pre-wrap text-foreground/80">
            {dimension.indexNotes?.trim() || 'No notes provided.'}
          </p>
        </div>

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
              ALLOWED OPTIONS ({dimension.options.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dimension.options.map((option, idx) => (
                <Badge key={idx} variant="secondary" size="xs">
                  {option.label}
                  {option.label !== option.value ? ` (${option.value})` : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-caption text-foreground/50">
          <span>Created: {createdDate}</span>
          <span>Updated: {updatedDate}</span>
        </div>

        <div
          className={`border-t border-gray-100 flex gap-3 pt-5 ${styles.footer}`}
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
    </ModalShell>
  );
}
