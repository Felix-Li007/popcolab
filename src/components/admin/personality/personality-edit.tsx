'use client';

import { useEffect, useState, useActionState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import styles from '@/styles/admin/personalities/personality-form.module.css';
import { Button, Input, TextArea } from '@/ui';
import type { PersonalityFormState } from '@/types/personality-type';

const EMPTY_STATE: PersonalityFormState = { errors: {} };

type FormAction = (
  prevState: PersonalityFormState,
  formData: FormData
) => Promise<PersonalityFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: {
    type: string;
    name: string;
    description: string;
    emoji: string;
    status: 'active' | 'draft';
    accentColor?: string;
    threshold?: number;
  };
};

type FormBodyProps = {
  action: FormAction;
  isEdit: boolean;
  initial?: Props['initial'];
  onClose: () => void;
};

const ACCENT_COLORS = [
  '#ff8de6',
  '#86efac',
  '#fdba74',
  '#93c5fd',
  '#f5dd42',
  '#e9d5ff',
];

function PersonalityFormBody({
  action,
  isEdit,
  initial,
  onClose,
}: FormBodyProps) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [accentColor, setAccentColor] = useState(
    initial?.accentColor ?? ACCENT_COLORS[0]
  );
  const [status, setStatus] = useState<'active' | 'draft'>(
    initial?.status ?? 'active'
  );

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-6 pt-4 pb-4">
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
                onChange={e => setStatus(e.target.value as 'active' | 'draft')}
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

        {/* ACCENT COLOUR */}
        <div>
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
        </div>
      </div>

      <div className={`px-6 flex items-center gap-3 shrink-0 ${styles.footer}`}>
        <Button
          type="submit"
          variant="primary"
          size="md"
          className={styles.btnCreate}
          disabled={isPending}
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
  );
}

export default function PersonalityForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
}: Props) {
  if (!isOpen) return null;

  const formKey = `${isEdit ? (initial?.type ?? 'edit') : 'new'}-${initial?.name ?? ''}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'New'} Personality`}
      panelClassName={styles.panel}
      bodyClassName={styles.body}
      rootTestId="personality-form-modal-root"
      panelTestId="personality-form-modal"
    >
      <PersonalityFormBody
        key={formKey}
        action={action}
        isEdit={isEdit}
        initial={initial}
        onClose={onClose}
      />
    </ModalShell>
  );
}
