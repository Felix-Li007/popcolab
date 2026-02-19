'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/personality-form-modal.module.css';

export type PersonalityData = {
  type: string;
  name: string;
  description: string;
  emoji: string;
  stars: number;
  status: 'active' | 'draft';
  accentColor?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PersonalityData) => void;
  initial?: PersonalityData;
};

const ACCENT_COLORS = [
  { hex: '#ff8de6', emoji: '🌸' },
  { hex: '#86efac', emoji: '🌿' },
  { hex: '#fdba74', emoji: '🍑' },
  { hex: '#93c5fd', emoji: '💙' },
  { hex: '#f5dd42', emoji: '⭐' },
  { hex: '#e9d5ff', emoji: '💜' },
];

export default function PersonalityFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
}: Props) {
  const isEdit = !!initial;

  const defaultAccent = ACCENT_COLORS[0];
  const empty: PersonalityData = {
    type: '',
    name: '',
    description: '',
    emoji: defaultAccent.emoji,
    stars: 3,
    status: 'active',
    accentColor: defaultAccent.hex,
  };

  const [form, setForm] = useState<PersonalityData>(initial ?? empty);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PersonalityData, string>>
  >({});

  useEffect(() => {
    if (isOpen) {
      setForm(initial ?? empty);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || typeof window === 'undefined') return null;

  const selectedAccent =
    ACCENT_COLORS.find(c => c.hex === form.accentColor) ?? defaultAccent;

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.type.trim()) e.type = 'Tag / Type is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ ...form, type: form.type.toUpperCase() });
  }

  function set<K extends keyof PersonalityData>(
    key: K,
    value: PersonalityData[K]
  ) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} className={styles.backdrop} />

      {/* Card */}
      <div className={styles.card}>
        {/* Header */}
        <div
          className={`px-6 bg-gradient-to-r from-lavender via-white to-coral-light border-b border-pink-light/50 flex items-center justify-between ${styles.header}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">🎭</span>
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              {isEdit ? 'Edit' : 'New'} Personality
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close"
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

        {/* Scrollable form */}
        <div className="px-6 pb-5 space-y-4 overflow-y-auto flex-1">
          {/* NAME */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. The Musician"
              className={`w-full text-sm font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-4 py-3 outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder:font-normal placeholder-gray-400 transition ${errors.name ? 'ring-2 ring-red-300 bg-red-50' : ''}`}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* TAG / TYPE */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Tag / Type
            </label>
            <input
              type="text"
              value={form.type}
              onChange={e => set('type', e.target.value.toUpperCase())}
              placeholder={`e.g. ${selectedAccent.emoji} MUSICIAN`}
              className={`w-full text-sm font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-4 py-3 outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder:font-normal placeholder-gray-400 transition ${errors.type ? 'ring-2 ring-red-300 bg-red-50' : ''}`}
            />
            {errors.type && (
              <p className="text-[10px] text-red-500 mt-1">{errors.type}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What makes this play type unique?"
              rows={3}
              className={`w-full text-sm font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-4 py-3 outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder:font-normal placeholder-gray-400 resize-none transition leading-relaxed ${errors.description ? 'ring-2 ring-red-300 bg-red-50' : ''}`}
            />
            {errors.description && (
              <p className="text-[10px] text-red-500 mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* ACCENT COLOUR */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Accent Colour
            </label>
            <div className="flex items-center gap-2.5">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.hex}
                  type="button"
                  title={color.emoji}
                  onClick={() => {
                    set('accentColor', color.hex);
                    set('emoji', color.emoji);
                  }}
                  style={{ backgroundColor: color.hex }}
                  className={`w-10 h-10 rounded-full transition-all ${
                    form.accentColor === color.hex
                      ? 'ring-2 ring-offset-2 ring-gray-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={form.status}
                onChange={e =>
                  set('status', e.target.value as 'active' | 'draft')
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

        {/* Footer */}
        <div
          className={`px-6 flex items-center gap-3 shrink-0 ${styles.footer}`}
        >
          <button
            type="button"
            onClick={handleSave}
            className={`${styles.btnCreate} flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white bg-magenta hover:opacity-90 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98]`}
          >
            <span className="text-sm leading-none">🚀</span>
            {isEdit ? 'Save Changes' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.btnCancel} flex items-center justify-center py-3 rounded-full text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shrink-0`}
          >
            Cancel
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
