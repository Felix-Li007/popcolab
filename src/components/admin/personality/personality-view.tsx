'use client';

import ModalShell from '@/components/shared/modal-shell';
import type { Personality } from '@/types/personality-type';
import styles from '@/styles/admin/personalities/personality-view.module.css';
import { Button, Badge } from '@/ui';

type PersonalityViewProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  personality: Personality;
};

export default function PersonalityView({
  isOpen,
  onClose,
  onEdit,
  personality,
}: Readonly<PersonalityViewProps>) {
  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-3">
          <span className={styles.emoji}>{personality.emoji}</span>
          <span className="truncate">{personality.name}</span>
        </div>
      }
      headerMeta={
        <Badge variant="personality" size="sm">
          {personality.type}
        </Badge>
      }
      panelClassName={styles.panel}
      bodyClassName={styles.scrollArea}
      rootTestId="personality-view-modal-root"
      panelTestId="personality-view-modal"
    >
      <div className="space-y-4 px-1 py-1">
        <div className="flex items-center">
          <Badge
            variant={personality.status === 'active' ? 'success' : 'default'}
            size="sm"
          >
            {personality.status === 'active' ? '● Active' : '○ Draft'}
          </Badge>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Description
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">
            {personality.description}
          </p>
        </div>

        <div
          className={`border-t border-gray-100 flex items-center gap-3 shrink-0 pt-6 ${styles.footer}`}
        >
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            className={styles.btnClose}
          >
            Close
          </Button>
          <Button
            onClick={onEdit}
            variant="primary"
            size="md"
            className={`${styles.btnEdit} hover:bg-teal-deep`}
            icon={
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
          >
            Edit
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
