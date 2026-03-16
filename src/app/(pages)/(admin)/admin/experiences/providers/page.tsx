import { Suspense } from 'react';
import ProviderContent from '@/components/admin/provider/provider-content';
import { getProviders } from '@/services/provider-service';
import type { Provider } from '@/types/provider-type';

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <Suspense fallback={null}>
      <ProviderContent initialData={providers as Provider[]} />
    </Suspense>
  );
}
