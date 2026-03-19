describe('url-helper base URL resolution', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('getAppBaseUrlFromHeaders prefers trusted env over spoofable headers', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://popcolab.example.com/';

    const { getAppBaseUrlFromHeaders } = await import('@/utils/url-helper');

    expect(
      getAppBaseUrlFromHeaders({
        get(name: string) {
          const values: Record<string, string | null> = {
            origin: 'https://evil.example.com',
            'x-forwarded-host': 'evil.example.com',
            'x-forwarded-proto': 'http',
            host: 'evil.example.com',
          };

          return values[name] ?? null;
        },
      })
    ).toBe('https://popcolab.example.com');
  });

  test('getAppBaseUrlFromHeaders uses validated forwarded host when no trusted env is set', async () => {
    const { getAppBaseUrlFromHeaders } = await import('@/utils/url-helper');

    expect(
      getAppBaseUrlFromHeaders({
        get(name: string) {
          const values: Record<string, string | null> = {
            origin: 'not a url',
            'x-forwarded-host': 'app.popcolab.test',
            'x-forwarded-proto': 'https',
            host: null,
          };

          return values[name] ?? null;
        },
      })
    ).toBe('https://app.popcolab.test');
  });

  test('getAppBaseUrlFromHeaders falls back to host and defaults protocol to https', async () => {
    const { getAppBaseUrlFromHeaders } = await import('@/utils/url-helper');

    expect(
      getAppBaseUrlFromHeaders({
        get(name: string) {
          const values: Record<string, string | null> = {
            origin: 'https://evil.example.com',
            'x-forwarded-host': null,
            'x-forwarded-proto': null,
            host: 'localhost:3000',
          };

          return values[name] ?? null;
        },
      })
    ).toBe('https://localhost:3000');
  });

  test('getAppBaseUrlFromHeaders returns null instead of throwing on malformed host input', async () => {
    const { getAppBaseUrlFromHeaders } = await import('@/utils/url-helper');

    expect(
      getAppBaseUrlFromHeaders({
        get(name: string) {
          const values: Record<string, string | null> = {
            origin: 'https://evil.example.com',
            'x-forwarded-host': 'bad host value',
            'x-forwarded-proto': 'https',
            host: null,
          };

          return values[name] ?? null;
        },
      })
    ).toBeNull();
  });

  test('getFallbackAppBaseUrl normalizes deployment env URLs safely', async () => {
    process.env.VERCEL_URL = 'preview.popcolab.app/';

    const { getFallbackAppBaseUrl } = await import('@/utils/url-helper');

    expect(getFallbackAppBaseUrl()).toBe('https://preview.popcolab.app');
  });
});

describe('url-helper dashboard checkout paths', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('buildDashboardExperienceCheckoutPath returns a stable checkout path without a trailing slash', async () => {
    const { buildDashboardExperienceCheckoutPath } =
      await import('@/utils/url-helper');

    expect(buildDashboardExperienceCheckoutPath(42)).toBe(
      '/dashboard/experiences/42/checkout'
    );
  });

  test('buildDashboardExperienceCheckoutResultPath appends result to the checkout path without duplicate slashes', async () => {
    const { buildDashboardExperienceCheckoutResultPath } =
      await import('@/utils/url-helper');

    expect(buildDashboardExperienceCheckoutResultPath(42)).toBe(
      '/dashboard/experiences/42/checkout/result'
    );
  });

  test('dashboard checkout path builders preserve numeric parameter formatting for zero-valued ids', async () => {
    const {
      buildDashboardExperienceCheckoutPath,
      buildDashboardExperienceCheckoutResultPath,
    } = await import('@/utils/url-helper');

    expect(buildDashboardExperienceCheckoutPath(0)).toBe(
      '/dashboard/experiences/0/checkout'
    );
    expect(buildDashboardExperienceCheckoutResultPath(0)).toBe(
      '/dashboard/experiences/0/checkout/result'
    );
  });
});
