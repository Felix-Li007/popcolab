const NEW_EXPERIENCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type ExperiencePricingSummary = {
  pricing: {
    startingPrice: number | null;
    addingPrice: number | null;
    startingHour: number | null;
    pricingModel: string | null;
  };
};

export function isNewExperience(createdAt?: Date) {
  if (!createdAt) return false;

  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return false;

  return Date.now() - createdTime <= NEW_EXPERIENCE_WINDOW_MS;
}

export function formatCadAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Not set';
  }

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getExperiencePricingSummary({
  pricing,
}: ExperiencePricingSummary) {
  if (pricing.startingPrice === null) {
    return 'Pricing not configured';
  }

  const parts = [`From ${formatCadAmount(pricing.startingPrice)}`];

  if (pricing.startingHour !== null) {
    parts.push(
      `for first ${pricing.startingHour} hour${pricing.startingHour === 1 ? '' : 's'}`
    );
  }

  if (pricing.addingPrice !== null) {
    parts.push(`+ ${formatCadAmount(pricing.addingPrice)} add-on`);
  }

  if (pricing.pricingModel?.trim()) {
    parts.push(pricing.pricingModel.trim());
  }

  return parts.join(' · ');
}
