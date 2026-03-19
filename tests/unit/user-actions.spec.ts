jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/services/clerk-service', () => ({
  getCurrentAuthContext: jest.fn(),
}));

jest.mock('@/services/user-service', () => ({
  normalizeUserEditableUpdateInput: jest.fn(),
  updateUserEditableFields: jest.fn(),
  validateUserEditableUpdateInput: jest.fn(),
}));

jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    company: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { getCurrentAuthContext } from '@/services/clerk-service';
import { prisma } from '@/libs/prisma-client';
import { getCompanyAction, updateCompanyAction } from '@/actions/user-actions';

const getCurrentAuthContextMock = getCurrentAuthContext as jest.MockedFunction<
  typeof getCurrentAuthContext
>;

type MockedPrisma = {
  user: {
    findFirst: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  company: {
    findFirst: jest.Mock;
    upsert: jest.Mock;
  };
};

const prismaMock = prisma as unknown as MockedPrisma;

describe('user-actions company fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getCurrentAuthContextMock.mockResolvedValue({
      isAuthenticated: true,
      user: {
        id: 'clerk_123',
        primaryEmailAddress: {
          emailAddress: 'owner@example.com',
        },
        emailAddresses: [],
      },
    } as never);
  });

  test('getCompanyAction maps the renamed and new company fields', async () => {
    prismaMock.company.findFirst.mockResolvedValue({
      id: 9,
      user_id: 42,
      company_name: 'Pop CoLab',
      department_name: 'Experience',
      role_title: 'Facilitator',
      work_mode: 'hybrid',
      company_size: 18,
      company_website: 'https://popcolab.com',
      created_at: new Date('2026-03-01T00:00:00.000Z'),
      updated_at: new Date('2026-03-02T00:00:00.000Z'),
    });

    await expect(getCompanyAction()).resolves.toEqual({
      id: 9,
      userId: 42,
      companyName: 'Pop CoLab',
      departmentName: 'Experience',
      roleTitle: 'Facilitator',
      workMode: 'hybrid',
      companySize: 18,
      companyWebsite: 'https://popcolab.com',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-02T00:00:00.000Z'),
    });
  });

  test('updateCompanyAction rejects a non-positive company size', async () => {
    await expect(
      updateCompanyAction({
        companyName: 'Pop CoLab',
        departmentName: '',
        roleTitle: '',
        workMode: '',
        companySize: '0',
        companyWebsite: '',
      })
    ).resolves.toEqual({
      success: false,
      error: 'Company size must be a positive integer.',
    });

    expect(prismaMock.company.upsert).not.toHaveBeenCalled();
  });

  test('updateCompanyAction saves companyName, companySize, and companyWebsite', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 42 });
    prismaMock.user.update.mockResolvedValue({ id: 42 });
    prismaMock.company.upsert.mockResolvedValue({
      id: 9,
      user_id: 42,
      company_name: 'Pop CoLab',
      department_name: 'Experience',
      role_title: 'Facilitator',
      work_mode: 'remote',
      company_size: 25,
      company_website: 'https://popcolab.com',
      created_at: new Date('2026-03-01T00:00:00.000Z'),
      updated_at: new Date('2026-03-02T00:00:00.000Z'),
    });

    await expect(
      updateCompanyAction({
        companyName: 'Pop CoLab',
        departmentName: 'Experience',
        roleTitle: 'Facilitator',
        workMode: 'remote',
        companySize: '25',
        companyWebsite: 'https://popcolab.com',
      })
    ).resolves.toEqual({
      success: true,
      data: {
        id: 9,
        userId: 42,
        companyName: 'Pop CoLab',
        departmentName: 'Experience',
        roleTitle: 'Facilitator',
        workMode: 'remote',
        companySize: 25,
        companyWebsite: 'https://popcolab.com',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
    });

    expect(prismaMock.company.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          company_name: 'Pop CoLab',
          company_size: 25,
          company_website: 'https://popcolab.com',
        }),
        create: expect.objectContaining({
          company_name: 'Pop CoLab',
          company_size: 25,
          company_website: 'https://popcolab.com',
        }),
      })
    );
  });
});
