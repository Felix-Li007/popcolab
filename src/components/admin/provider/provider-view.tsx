'use client';

import ModalShell from '@/components/shared/modal-shell';
import { Badge, Button } from '@/ui';
import type { Provider } from '@/types/provider-type';

type Props = {
  isOpen: boolean;
  provider: Provider | null;
  onClose: () => void;
  onEdit: (id: number) => void;
};

function formatDate(value?: Date) {
  return value ? new Date(value).toLocaleDateString('en-US') : '-';
}

export default function ProviderView({
  isOpen,
  provider,
  onClose,
  onEdit,
}: Props) {
  if (!isOpen || !provider) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-display leading-none">🏷️</span>
          <span className="truncate">{provider.providerLabel}</span>
        </div>
      }
      subtitle={provider.providerType}
      panelClassName="max-w-2xl"
      bodyClassName="overflow-y-auto"
      rootTestId="provider-view-modal-root"
      panelTestId="provider-view-modal"
    >
      <div className="space-y-5 px-1 py-1">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Provider Type
            </p>
            <Badge variant="default" size="sm">
              {provider.providerType}
            </Badge>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Linked Experiences
            </p>
            <Badge
              variant={provider.experienceCount > 0 ? 'success' : 'secondary'}
              size="sm"
            >
              {provider.experienceCount}
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Provider Notes
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {provider.providerNotes?.trim() || 'No provider notes provided.'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Pricing Notes
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {provider.pricingNotes?.trim() || 'No pricing notes provided.'}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-500">
          <span>Created: {formatDate(provider.createdAt)}</span>
          <span>Updated: {formatDate(provider.updatedAt)}</span>
        </div>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              if (provider.id) onEdit(provider.id);
            }}
          >
            Edit
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
