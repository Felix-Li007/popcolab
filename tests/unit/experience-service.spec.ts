jest.mock('@/libs/prisma-client', () => ({
  prisma: {},
}));

import type { Experience } from '@/types/experience-type';
import {
  buildExperiencePurchaseQuote,
  validateExperienceFields,
} from '@/services/experience-service';

function createExperience(
  overrides: Partial<Experience> = {},
  pricingOverrides: Partial<Experience['pricing']> = {}
): Experience {
  return {
    id: 7,
    providerId: 3,
    providerLabel: 'Pop CoLab',
    providerType: 'internal',
    categoryId: 4,
    categoryTitle: 'Team Building',
    experienceTitle: 'Facilitated Workshop',
    experienceStatus: 'active',
    popularityIndex: 1,
    durationMin: 60,
    durationMax: 120,
    capacityMax: 25,
    leadType: 'inbound',
    deliveryMethods: 'virtual',
    pricing: {
      startingPrice: 300,
      addingPrice: 50,
      startingHour: 2,
      pricingModel: 'Base + add-on',
      pricingNotes: null,
      ...pricingOverrides,
    },
    dietaryConsiderations: null,
    takeItem: null,
    travelFlying: null,
    createdBy: 1,
    dimensionCount: 0,
    proposalCount: 0,
    calendarCount: 0,
    dimensionValues: [],
    ...overrides,
  };
}

describe('experience-service pricing validation', () => {
  test('validateExperienceFields allows a zero starting price', () => {
    const errors = validateExperienceFields({
      experienceTitle: 'Facilitated Workshop',
      experienceStatus: 'active',
      providerId: 3,
      categoryId: 4,
      durationMin: 60,
      durationMax: 120,
      capacityMax: 25,
      startingPrice: 0,
      addingPrice: 0,
      startingHour: 2,
      pricingModel: 'Base + add-on',
      pricingNotes: null,
      leadType: 'inbound',
      deliveryMethods: 'virtual',
      dietaryConsiderations: null,
      takeItem: null,
      travelFlying: null,
      dimensionValues: [],
    });

    expect(errors.startingPrice).toBeUndefined();
    expect(errors.addingPrice).toBeUndefined();
  });

  test('buildExperiencePurchaseQuote rejects zero-priced experiences before Stripe checkout', () => {
    expect(() =>
      buildExperiencePurchaseQuote(
        createExperience({}, { startingPrice: 0, addingPrice: 0 })
      )
    ).toThrow('This experience is not available for checkout.');
  });

  test('buildExperiencePurchaseQuote still allows zero add-on pricing when the base price is positive', () => {
    const quote = buildExperiencePurchaseQuote(
      createExperience({}, { startingPrice: 300, addingPrice: 0 }),
      4
    );

    expect(quote.baseAmountCad).toBe(300);
    expect(quote.extraAmountCad).toBe(0);
    expect(quote.totalAmountCad).toBe(300);
  });
});
