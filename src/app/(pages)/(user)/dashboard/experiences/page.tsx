'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Experience } from '@/types/experience-type';
import { Personality } from '@/types/personality-type';
import Image from 'next/image';

function UserDashboardContent() {
  const { user } = useUser();
  const displayName = user?.firstName || user?.fullName || 'User';

  const [personality, setPersonality] = useState<Personality | null>(null);
  const [recommended, setRecommended] = useState<Experience[]>([]);
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard-experiences');
        const data = await res.json();
        setPersonality(data.personality || null);
        setRecommended(data.experiences || []);
        setAllExperiences(data.allExperiences || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {displayName} 👋</h1>
        {personality?.type && (
          <p className="text-sm text-gray-500 mt-1">
            Personality Type: {personality.type}
          </p>
        )}
      </div>

      {/* Recommended Experiences */}
      {recommended.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recommended Experiences</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((exp: Experience) => (
              <ExperienceCard
                key={exp.id}
                exp={{ ...exp, isRecommended: true }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Experiences */}
      {allExperiences.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Other Experiences</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {allExperiences.map((exp: Experience) => (
              <ExperienceCard
                key={exp.id}
                exp={{ ...exp, isRecommended: false }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExperienceCard({
  exp,
}: {
  exp: Experience & { isRecommended?: boolean };
}) {
  return (
    <div className="relative border rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      {/* Optional Banner / Image */}
      {exp.imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          {exp.imageUrl && (
            <div className="h-40 w-full overflow-hidden relative">
              <Image
                src={exp.imageUrl}
                alt={exp.experienceTitle}
                fill
                className="object-cover"
                priority={exp.isRecommended} // optional
              />
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-800">
            {exp.experienceTitle}
          </h3>

          {/* Category Badge */}
          <span className="inline-block mt-1 text-xs font-medium px-2 py-1 bg-pink-100 text-pink-600 rounded-full">
            {exp.categoryTitle}
          </span>

          {/* Description */}
          {exp.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
              {exp.description}
            </p>
          )}

          {/* Location & Timing */}
          {exp.location && (
            <p className="text-sm text-gray-500 mt-1">
              Location: {exp.is_online ? 'Online' : exp.location}
            </p>
          )}
          {exp.timing && (
            <p className="text-sm text-gray-500 mt-1">Timing: {exp.timing}</p>
          )}

          {/* Duration */}
          {exp.durationMin && exp.durationMax && (
            <p className="text-sm text-gray-400 mt-1">
              {exp.durationMin}-{exp.durationMax} min
            </p>
          )}
        </div>

        {/* Pricing */}
        <p className="text-sm font-semibold text-pink-600 mt-2">
          ${exp.pricing.startingPrice ?? 'N/A'}
        </p>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/experiences/${exp.id}`}
            className="flex-1 text-center py-2 px-4 border border-pink-500 text-pink-500 rounded font-semibold hover:bg-pink-50 transition-colors"
          >
            View Info
          </Link>
          <Link
            href={`/experiences/${exp.id}/checkout`}
            className="flex-1 text-center py-2 px-4 bg-linear-to-r from-pink-500 to-pink-600 text-white rounded font-semibold hover:from-pink-600 hover:to-pink-700 transition-all"
          >
            Book Now
          </Link>
        </div>
      </div>

      {/* Recommended Ribbon */}
      {exp.isRecommended && (
        <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-semibold px-2 py-1 rounded">
          Recommended
        </div>
      )}
    </div>
  );
}

export default function AllExperiencesPage() {
  return (
    <div className="p-6">
      <UserDashboardContent />
    </div>
  );
}
