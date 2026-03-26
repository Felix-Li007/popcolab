import type { PrismaClient } from '@/libs/prisma/client';

type TemporaryExperienceImageAsset = {
  imageUrl: string;
  imageAlt: string;
};

const temporaryImageAssets: TemporaryExperienceImageAsset[] = [
  {
    imageUrl: '/images/Workshop.png',
    imageAlt: 'Workshop preview image',
  },
  {
    imageUrl: '/images/team-building.png',
    imageAlt: 'Team building preview image',
  },
  {
    imageUrl: '/images/Cocktail.png',
    imageAlt: 'Cocktail preview image',
  },
  {
    imageUrl: '/images/image.png',
    imageAlt: 'General experience preview image',
  },
  {
    imageUrl: '/images/doodle.png',
    imageAlt: 'Doodle style preview image',
  },
];

export async function seedTemporaryExperienceImages(
  prisma: PrismaClient
): Promise<void> {
  const targetExperiences = await prisma.experience.findMany({
    where: {
      provider: {
        provider_type: 'POP_COLAB',
      },
    },
    orderBy: [{ popularity_index: 'desc' }, { id: 'asc' }],
    take: temporaryImageAssets.length,
    select: {
      id: true,
      experience_title: true,
    },
  });

  if (targetExperiences.length === 0) {
    console.warn(
      '⚠️  Skipping experience image seed because no POP_COLAB experiences were found.'
    );
    return;
  }

  const targetExperienceIds = targetExperiences.map(
    experience => experience.id
  );

  await prisma.experienceImage.deleteMany({
    where: {
      experience_id: {
        in: targetExperienceIds,
      },
    },
  });

  const imageRows = targetExperiences.map((experience, index) => {
    const asset = temporaryImageAssets[index % temporaryImageAssets.length];

    return {
      experience_id: experience.id,
      image_url: asset.imageUrl,
      is_cover: true,
      image_alt: `${experience.experience_title} cover image`,
      image_notes: 'Temporary local preview image seed.',
    };
  });

  const fourthExperience = targetExperiences[3];
  if (fourthExperience) {
    const extraAsset = temporaryImageAssets[4];
    imageRows.push({
      experience_id: fourthExperience.id,
      image_url: extraAsset.imageUrl,
      is_cover: false,
      image_alt: `${fourthExperience.experience_title} gallery image`,
      image_notes: 'Temporary local preview image seed.',
    });
  }

  await prisma.experienceImage.createMany({
    data: imageRows,
  });

  console.log(
    `Seeded ${imageRows.length} temporary experience images for preview`
  );
}
