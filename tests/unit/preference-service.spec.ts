jest.mock('@/libs/prisma-client', () => ({
  prisma: {
    dimensionIndex: {
      findMany: jest.fn(),
    },
    userExperience: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userPreference: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/services/qstash-service', () => ({
  publishQStashTask: jest.fn(),
}));

jest.mock('@/services/vector-service', () => ({
  extractPreferenceVector: jest.fn(),
}));

import { prisma } from '@/libs/prisma-client';
import { extractPreferenceVector } from '@/services/vector-service';
import { completeExperience } from '@/services/user-service';
import { refreshUserPreference } from '@/services/preference-service';
import { publishQStashTask } from '@/services/qstash-service';

type MockedPrisma = {
  dimensionIndex: {
    findMany: jest.Mock;
  };
  userExperience: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  userPreference: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

const prismaMock = prisma as unknown as MockedPrisma;
const extractPreferenceVectorMock =
  extractPreferenceVector as jest.MockedFunction<
    typeof extractPreferenceVector
  >;
const publishQStashTaskMock = publishQStashTask as jest.MockedFunction<
  typeof publishQStashTask
>;

describe('preference-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    publishQStashTaskMock.mockResolvedValue({} as never);
    prismaMock.dimensionIndex.findMany.mockResolvedValue([
      { id: 101 },
      { id: 102 },
    ]);
    extractPreferenceVectorMock.mockResolvedValue([0.1, 0.2]);
  });

  test('completeExperience marks the row completed and queues a refresh event', async () => {
    prismaMock.userExperience.findUnique.mockResolvedValue({
      id: 11,
      user_id: 21,
      process_status: 'PROGRESS',
      complete_date: null,
    });
    prismaMock.userExperience.update.mockResolvedValue({ id: 11 });

    await expect(completeExperience(11)).resolves.toMatchObject({
      userExperienceId: 11,
      userId: 21,
      completed: true,
    });

    expect(prismaMock.userExperience.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: {
        process_status: 'COMPLETED',
        complete_date: expect.any(Date),
      },
    });

    expect(publishQStashTaskMock).toHaveBeenCalledWith(
      {
        type: 'user.experience.completed',
        userExperienceId: 11,
      },
      {
        deduplicationId: 'experience-completed:11',
        retries: 3,
      }
    );
  });

  test('refreshUserPreferenceForUserExperience persists a normalized snapshot for completed history', async () => {
    prismaMock.userExperience.findUnique.mockResolvedValue({
      user_id: 21,
      process_status: 'COMPLETED',
    });
    prismaMock.userExperience.findMany.mockResolvedValue([
      {
        experience: {
          category_id: 1,
          provider_id: 10,
          duration_min: 30,
          duration_max: 30,
          experience_dimensions: [{ dimension_id: 101 }],
        },
      },
      {
        experience: {
          category_id: 1,
          provider_id: 20,
          duration_min: 180,
          duration_max: 180,
          experience_dimensions: [{ dimension_id: 101 }, { dimension_id: 102 }],
        },
      },
    ]);
    prismaMock.userPreference.findFirst.mockResolvedValue(null);
    prismaMock.userPreference.create.mockResolvedValue({
      id: 99,
      source_window: 2,
    });

    await expect(refreshUserPreference(11)).resolves.toMatchObject({
      experienceId: 11,
      userId: 21,
      userPreferenceId: 99,
      sourceWindow: 2,
    });

    expect(prismaMock.userPreference.create).toHaveBeenCalledWith({
      data: {
        user_id: 21,
        category_score: { '1': 1 },
        provider_score: { '10': 0.5, '20': 0.5 },
        duration_range: { under_1h: 0.5, '2_4h': 0.5 },
        dimension_weight: {
          '101': 0.6666666666666666,
          '102': 0.3333333333333333,
        },
        vector_embed: [0.1, 0.2],
        source_window: 2,
      },
    });
  });
});
