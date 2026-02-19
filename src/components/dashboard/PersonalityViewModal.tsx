'use client';

import { createPortal } from 'react-dom';
import type { PersonalityData } from './PersonalityFormModal';
import styles from '@/styles/personality-view-modal.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  personality: PersonalityData;
};

const typeStyles: Record<string, { bg: string; text: string }> = {
  JOKER: { bg: 'bg-teal-deep', text: 'text-white' },
  KINESTHETE: { bg: 'bg-magenta', text: 'text-white' },
  EXPLORER: { bg: 'bg-brand-yellow', text: 'text-gray-800' },
  COMPETITOR: { bg: 'bg-pink-bright', text: 'text-gray-800' },
  COLLECTOR: { bg: 'bg-pink-medium', text: 'text-gray-800' },
  CREATOR: { bg: 'bg-coral-vibe', text: 'text-white' },
  DIRECTOR: { bg: 'bg-teal-accent', text: 'text-white' },
  STORYTELLER: { bg: 'bg-coral-red', text: 'text-white' },
};

export default function PersonalityViewModal({
  isOpen,
  onClose,
  onEdit,
  personality,
}: Props) {
  if (!isOpen || typeof window === 'undefined') return null;

  const style = typeStyles[personality.type] ?? {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Card — centered via transform */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: 'min(28rem, calc(100vw - 2rem))',
          maxHeight: '92vh',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #f3e8ff',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-poppins), sans-serif',
        }}
      >
        {/* Gradient header */}
        <div
          className={`bg-gradient-to-r from-lavender via-white to-coral-light px-6 border-b border-pink-light/50 flex items-center justify-between rounded-t-2xl shrink-0 ${styles.header}`}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>
              {personality.emoji}
            </span>
            <div>
              <h2 className="text-base font-black text-gray-800 leading-tight">
                {personality.name}
              </h2>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${style.bg} ${style.text}`}
              >
                {personality.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-pink-light/60 text-gray-400 hover:text-magenta transition-colors shrink-0"
          >
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
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className={`px-6 space-y-4 overflow-y-auto flex-1 ${styles.content}`}
        >
          {/* Status + stars row */}
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                personality.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {personality.status === 'active' ? '● Active' : '○ Draft'}
            </span>
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

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Description
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {personality.description}
            </p>
          </div>
        </div>

        {/* Sticky footer */}
        <div
          className={`px-6 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0 ${styles.footer}`}
        >
          <button
            onClick={onClose}
            className={`${styles.btnClose} flex items-center justify-center py-3 rounded-full text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors`}
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className={`${styles.btnEdit} flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white bg-magenta hover:bg-teal-deep transition-colors`}
          >
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
            Edit
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
