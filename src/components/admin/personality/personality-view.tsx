'use client';

import { createPortal } from 'react-dom';
import type { Personality } from '@/types/personality-type';
import styles from '@/styles/personality-view-modal.module.css';
import { Button, Badge } from '@/ui';
import { getPersonalityStyle } from '@/constants/personality-styles';

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
}: PersonalityViewProps) {
  if (!isOpen || typeof window === 'undefined') return null;

  const style = getPersonalityStyle(personality.type);

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.modal}>
        <div
          className={`bg-gradient-to-r from-lavender via-white to-coral-light px-6 border-b border-pink-light/50 flex items-center justify-between rounded-t-2xl shrink-0 ${styles.header}`}
        >
          <div className="flex items-center gap-3">
            <span className={styles.emoji}>{personality.emoji}</span>
            <div>
              <h2 className="text-base font-black text-gray-800 leading-tight">
                {personality.name}
              </h2>
              <Badge
                variant="personality"
                size="sm"
                bgColor={style.bg}
                textColor={style.text}
                className="mt-0.5"
              >
                {personality.type}
              </Badge>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="icon"
            size="sm"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            }
          />
        </div>

        <div
          className={`px-6 space-y-4 overflow-y-auto flex-1 ${styles.content} ${styles.scrollArea}`}
        >
          <div className="flex items-center justify-between">
            <Badge
              variant={personality.status === 'active' ? 'success' : 'default'}
              size="sm"
            >
              {personality.status === 'active' ? '● Active' : '○ Draft'}
            </Badge>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <svg
                  key={n}
                  className={`w-4 h-4 ${n <= personality.stars ? 'text-brand-yellow' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Description
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {personality.description}
            </p>
          </div>
        </div>

        <div
          className={`px-6 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0 ${styles.footer}`}
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
    </>,
    document.body
  );
}
