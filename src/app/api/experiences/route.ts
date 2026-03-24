import { NextResponse } from 'next/server';
import { getDashboardExperiences } from '@/services/experience-service';
import { getUserDashboardData } from '@/services/user-dashboard-service';
import { getCurrentAuthContext } from '@/services/clerk-service';

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();

    if (!auth.isAuthenticated) {
      return NextResponse.json({
        personality: null,
        experiences: [],
      });
    }

    const data = await getUserDashboardData(auth.user!.id);

    // ✅ get experiences (already includes dimensionValues)
    const experiences = await getDashboardExperiences(100);

    // ✅ FIXED: dynamic filtering (NO hardcoding)
    const recommended = experiences.filter(exp => {
      if (exp.experienceStatus !== 'active') return false;

      return exp.dimensionValues?.some(d => {
        const value = Number(d.expectedValue);
        return !isNaN(value) && value >= 3;
      });
    });

    return NextResponse.json({
      personality: data.personality || null,
      experiences: recommended.slice(0, 5),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);

    return NextResponse.json({
      personality: null,
      experiences: [],
    });
  }
}
