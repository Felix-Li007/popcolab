import type { PrismaClient } from '@/libs/prisma/client';

type ProviderSeed = {
  provider_type: string;
  provider_label: string;
  provider_notes: string | null;
  pricing_notes: string | null;
};

const providerDefinitions: ProviderSeed[] = [
  {
    provider_type: 'POP_COLAB',
    provider_label: 'Pop CoLab',
    provider_notes:
      'Pop CoLab creates and delivers the experience (your team runs it).',
    pricing_notes:
      'Typically per-person + base fee or per-session + base fee (Pop CoLab staff time included).',
  },
  {
    provider_type: 'PARTNER_OR_FACILITATOR',
    provider_label: 'Partner / Facilitator',
    provider_notes:
      'An external facilitator delivers the experience (Pop CoLab may co-host or provide space).',
    pricing_notes:
      'May include facilitator fee and/or different margin structure; confirm lead time + cancellation policy.',
  },
  {
    provider_type: 'PARTNER_OR_COLLAB',
    provider_label: 'Co-created Collaboration',
    provider_notes:
      'Co-designed experience delivered jointly (Pop CoLab + partner).',
    pricing_notes:
      'Typically includes both Pop CoLab base fee + partner fee/commission; clarify deliverables.',
  },
  {
    provider_type: 'UNKNOWN',
    provider_label: 'Unknown / TBD',
    provider_notes:
      'Placeholder until provider + delivery responsibilities are confirmed.',
    pricing_notes:
      'Do not auto-price; require manual review before recommending as final.',
  },
];

export async function seedProviders(prisma: PrismaClient): Promise<void> {
  const existingProviders = await prisma.provider.findMany({
    where: {
      provider_type: {
        in: providerDefinitions.map(provider => provider.provider_type),
      },
    },
    orderBy: { id: 'asc' },
  });

  const providerByType = new Map<string, (typeof existingProviders)[number]>();
  for (const provider of existingProviders) {
    if (!providerByType.has(provider.provider_type)) {
      providerByType.set(provider.provider_type, provider);
    }
  }

  for (const provider of providerDefinitions) {
    const existing = providerByType.get(provider.provider_type);

    if (existing) {
      await prisma.provider.update({
        where: { id: existing.id },
        data: {
          provider_label: provider.provider_label,
          provider_notes: provider.provider_notes,
          pricing_notes: provider.pricing_notes,
        },
      });
      console.log(`Updated provider: ${provider.provider_type}`);
      continue;
    }

    await prisma.provider.create({
      data: provider,
    });
    console.log(`Created provider: ${provider.provider_type}`);
  }
}
