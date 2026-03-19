describe('experience utils', () => {
  let dateNowSpy: jest.SpiedFunction<typeof Date.now>;

  beforeEach(() => {
    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-03-18T12:00:00.000Z').getTime());
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  test('isNewExperience returns true within seven days', async () => {
    const { isNewExperience } = await import('@/utils/experience');

    expect(isNewExperience(new Date('2026-03-12T12:00:01.000Z'))).toBe(true);
  });

  test('isNewExperience returns true at the seven day boundary', async () => {
    const { isNewExperience } = await import('@/utils/experience');

    expect(isNewExperience(new Date('2026-03-11T12:00:00.000Z'))).toBe(true);
  });

  test('isNewExperience returns false when older than seven days', async () => {
    const { isNewExperience } = await import('@/utils/experience');

    expect(isNewExperience(new Date('2026-03-11T11:59:59.999Z'))).toBe(false);
  });

  test('isNewExperience returns false for missing or invalid dates', async () => {
    const { isNewExperience } = await import('@/utils/experience');

    expect(isNewExperience()).toBe(false);
    expect(isNewExperience(new Date('invalid'))).toBe(false);
  });

  test('formatCadAmount returns Not set for null, undefined, and invalid values', async () => {
    const { formatCadAmount } = await import('@/utils/experience');

    expect(formatCadAmount(null)).toBe('Not set');
    expect(formatCadAmount(undefined)).toBe('Not set');
    expect(formatCadAmount(Number.NaN)).toBe('Not set');
  });

  test('formatCadAmount formats whole CAD values without decimals', async () => {
    const { formatCadAmount } = await import('@/utils/experience');

    expect(formatCadAmount(0)).toBe('$0');
    expect(formatCadAmount(25)).toBe('$25');
    expect(formatCadAmount(300)).toBe('$300');
  });

  test('getExperiencePricingSummary returns a fallback when pricing is not configured', async () => {
    const { getExperiencePricingSummary } = await import('@/utils/experience');

    expect(
      getExperiencePricingSummary({
        pricing: {
          startingPrice: null,
          addingPrice: null,
          startingHour: null,
          pricingModel: null,
        },
      })
    ).toBe('Pricing not configured');
  });

  test('getExperiencePricingSummary handles singular hours and includes add-on pricing', async () => {
    const { getExperiencePricingSummary } = await import('@/utils/experience');

    expect(
      getExperiencePricingSummary({
        pricing: {
          startingPrice: 300,
          addingPrice: 25,
          startingHour: 1,
          pricingModel: null,
        },
      })
    ).toBe('From $300 · for first 1 hour · + $25 add-on');
  });

  test('getExperiencePricingSummary pluralizes hours and trims pricing model text', async () => {
    const { getExperiencePricingSummary } = await import('@/utils/experience');

    expect(
      getExperiencePricingSummary({
        pricing: {
          startingPrice: 450,
          addingPrice: 50,
          startingHour: 3,
          pricingModel: '  Base + add-on  ',
        },
      })
    ).toBe('From $450 · for first 3 hours · + $50 add-on · Base + add-on');
  });

  test('getExperiencePricingSummary omits optional hour and add-on segments when absent', async () => {
    const { getExperiencePricingSummary } = await import('@/utils/experience');

    expect(
      getExperiencePricingSummary({
        pricing: {
          startingPrice: 200,
          addingPrice: null,
          startingHour: null,
          pricingModel: 'Flat rate',
        },
      })
    ).toBe('From $200 · Flat rate');
  });
});
