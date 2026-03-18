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
});
