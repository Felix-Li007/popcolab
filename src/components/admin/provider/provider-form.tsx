'use client';

import { useActionState, useEffect, useId } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input, TextArea } from '@/ui';
import type { Provider, ProviderFormState } from '@/types/provider-type';

type FormAction = (
  prevState: ProviderFormState,
  formData: FormData
) => Promise<ProviderFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: Provider | null;
  providerTypeOptions: string[];
  onSuccess: () => void;
};

const EMPTY_STATE: ProviderFormState = { errors: {} };

function ProviderFormBody({
  action,
  isEdit,
  initial,
  providerTypeOptions,
  onClose,
  onSuccess,
}: Readonly<Omit<Props, 'isOpen'>>) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);
  const formFieldId = useId();
  const providerTypeId = `${formFieldId}-provider-type`;
  let submitLabel = 'Create Provider';

  if (isPending) {
    submitLabel = 'Saving…';
  } else if (isEdit) {
    submitLabel = 'Save Changes';
  }

  useEffect(() => {
    if (state.success) onSuccess();
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {state.errors._form ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {state.errors._form}
          </div>
        ) : null}

        <Input
          name="providerLabel"
          label="Provider Label"
          placeholder="e.g. Pop CoLab"
          defaultValue={initial?.providerLabel ?? ''}
          error={state.errors.providerLabel}
          inputSize="sm"
          required
        />

        <div>
          <label
            htmlFor={providerTypeId}
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500"
          >
            Provider Type
          </label>
          <select
            id={providerTypeId}
            name="providerType"
            defaultValue={initial?.providerType ?? ''}
            className={`w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
              state.errors.providerType ? 'bg-red-50 ring-2 ring-red-300' : ''
            }`}
            required
          >
            <option value="" disabled>
              Select provider type
            </option>
            {providerTypeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {state.errors.providerType ? (
            <p className="mt-1 text-[10px] text-red-500">
              {state.errors.providerType}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-gray-400">
              Choose from existing provider types.
            </p>
          )}
        </div>

        <TextArea
          name="providerNotes"
          label="Provider Notes"
          placeholder="Describe how this provider delivers the experience..."
          defaultValue={initial?.providerNotes ?? ''}
          error={state.errors.providerNotes}
          inputSize="sm"
          rows={4}
        />

        <TextArea
          name="pricingNotes"
          label="Pricing Notes"
          placeholder="Describe how pricing is usually structured..."
          defaultValue={initial?.pricingNotes ?? ''}
          error={state.errors.pricingNotes}
          inputSize="sm"
          rows={4}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function ProviderForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  providerTypeOptions,
  onSuccess,
}: Readonly<Props>) {
  if (!isOpen) return null;

  const formKey = `${isEdit ? (initial?.id ?? 'edit') : 'new'}-${initial?.updatedAt?.toString() ?? 'draft'}`;
  const subtitle = isEdit
    ? (initial?.providerType ?? '')
    : 'Add a provider source for experiences';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Provider' : 'Create Provider'}
      subtitle={subtitle}
      panelClassName="max-w-2xl"
      bodyClassName="overflow-hidden"
      rootTestId="provider-form-modal-root"
      panelTestId="provider-form-modal"
    >
      <ProviderFormBody
        key={formKey}
        action={action}
        isEdit={isEdit}
        initial={initial}
        providerTypeOptions={providerTypeOptions}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </ModalShell>
  );
}
