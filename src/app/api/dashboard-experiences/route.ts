import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma-client';

export async function GET() {
  try {
    // Fetch all experiences posted by admin (provider_id = 1)
    const allExperiences = await prisma.experience.findMany({
      where: {
        provider_id: 1, // admin's provider id
      },
      include: {
        category: true, // ✅ include category to get its name
      },
      orderBy: {
        id: 'desc',
      },
    });

    // Map DB fields to frontend format
    const formatted = allExperiences.map(exp => ({
      id: exp.id,
      experienceTitle: exp.experience_title,
      categoryTitle: exp.category?.category_title ?? 'No category', // now real category name
      pricing: { startingPrice: null }, // if you don’t have pricing table yet
      durationMin: exp.duration_min,
      durationMax: exp.duration_max,
    }));

    // Top 5 recommended
    const recommended = formatted.slice(0, 5);
    const others = formatted.slice(5);

    return NextResponse.json({
      personality: null, // replace with real personality if available
      experiences: recommended,
      allExperiences: others,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { personality: null, experiences: [], allExperiences: [] },
      { status: 500 }
    );
  }
}
