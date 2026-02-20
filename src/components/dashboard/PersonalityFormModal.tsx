'use client';

import { useEffect, useState, useActionState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/personality-form-modal.module.css';
import { Button, Input, TextArea } from '@/components/ui';
import type { PersonalityFormState } from '@/types/personality';

const EMPTY_STATE: PersonalityFormState = { errors: {} };

type FormAction = (
  prevState: PersonalityFormState,
  formData: FormData
) => Promise<PersonalityFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Pass createPersonalityAction or updatePersonalityAction.bind(null, id) */
  action: FormAction;
  isEdit?: boolean;
  initial?: {
    type: string;
    name: string;
    description: string;
    emoji: string;
    stars: number;
    status: 'active' | 'draft';
    accentColor?: string;
    threshold?: number;
  };
};

const ACCENT_COLORS = [
  '#ff8de6',
  '#86efac',
  '#fdba74',
  '#93c5fd',
  '#f5dd42',
  '#e9d5ff',
];

export default function PersonalityFormModal({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [accentColor, setAccentColor] = useState(
    initial?.accentColor ?? ACCENT_COLORS[0]
  );
  const [stars, setStars] = useState(initial?.stars ?? 3);
  const [status, setStatus] = useState<'active' | 'draft'>(
    initial?.status ?? 'active'
  );

  useEffect(() => {
    if (isOpen) {
      setEmoji(initial?.emoji ?? '');
      setAccentColor(initial?.accentColor ?? ACCENT_COLORS[0]);
      setStars(initial?.stars ?? 3);
      setStatus(initial?.status ?? 'active');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (state.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  if (!isOpen || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div onClick={onClose} className={styles.backdrop} />

      <form action={formAction} className={styles.card}>
        <div
          className={`px-6 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 flex items-center justify-between ${styles.header}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none"></span>
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              {isEdit ? 'Edit' : 'New'} Personality
            </h2>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="icon"
            size="sm"
            title="Close"
            aria-label="Close"
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
          className={`px-6 pt-4 pb-4 space-y-3 overflow-y-auto flex-1 ${styles.scrollArea}`}
        >
          {/* General error banner */}
          {state.errors._form && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {state.errors._form}
            </div>
          )}

          <Input
            label="Name"
            name="name"
            type="text"
            defaultValue={initial?.name ?? ''}
            placeholder="e.g. The Musician"
            error={state.errors.name}
          />

          {/* TAG / TYPE  +  SCORE THRESHOLD */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tag / Type"
              name="type"
              type="text"
              defaultValue={initial?.type ?? ''}
              placeholder="e.g. MUSICIAN"
              error={state.errors.type}
              disabled={isEdit}
              helperText={
                isEdit ? 'Type cannot be changed after creation' : undefined
              }
            />
            <Input
              label="Score Threshold"
              name="threshold"
              type="number"
              defaultValue={String(initial?.threshold ?? 0)}
              placeholder="e.g. 75"
              helperText="Min score to assign this personality"
              error={state.errors.threshold}
            />
          </div>

          <TextArea
            label="Description"
            name="description"
            defaultValue={initial?.description ?? ''}
            placeholder="What makes this play type unique?"
            rows={2}
            error={state.errors.description}
          />

          {/* EMOJI  +  STATUS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Emoji
              </label>
              <div className="flex items-center gap-2">
                <span className="text-3xl w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl shrink-0">
                  {emoji || '?'}
                </span>
                <input
                  type="text"
                  name="emoji"
                  value={emoji}
                  onChange={e => {
                    const segments = [
                      ...new Intl.Segmenter().segment(e.target.value),
                    ];
                    setEmoji(segments.length > 0 ? segments[0].segment : '');
                  }}
                  placeholder="Paste emoji"
                  className="flex-1 min-w-0 text-sm rounded-2xl bg-gray-100 border-0 px-3 py-3 outline-none focus:ring-2 focus:ring-magenta/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={status}
                  onChange={e =>
                    setStatus(e.target.value as 'active' | 'draft')
                  }
                  title="Status"
                  aria-label="Status"
                  className="w-full text-sm font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-4 py-3 outline-none focus:ring-2 focus:ring-magenta/30 appearance-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l4-4 4 4M8 15l4 4 4-4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ACCENT COLOUR  +  STARS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Accent Colour
              </label>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setAccentColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 shrink-0 aspect-square rounded-full transition-all ${
                      accentColor === color
                        ? 'ring-2 ring-offset-2 ring-gray-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
              <input type="hidden" name="accentColor" value={accentColor} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Stars
              </label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStars(i + 1)}
                    className="focus:outline-none"
                    aria-label={`${i + 1} star${i > 0 ? 's' : ''}`}
                  >
                    <svg
                      className={`w-6 h-6 transition-colors ${
                        i < stars
                          ? 'text-brand-yellow'
                          : 'text-gray-200 hover:text-brand-yellow/60'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              <input type="hidden" name="stars" value={stars} />
            </div>
          </div>
        </div>

        <div
          className={`px-6 flex items-center gap-3 shrink-0 ${styles.footer}`}
        >
          <Button
            type="submit"
            variant="primary"
            size="md"
            className={styles.btnCreate}
            disabled={isPending}
            icon={
              <span className="text-sm leading-none">
                {isPending ? '' : ''}
              </span>
            }
          >
            {isPending ? 'Saving' : isEdit ? 'Save Changes' : 'Create'}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            size="md"
            className={styles.btnCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>,
    document.body
  );
}
