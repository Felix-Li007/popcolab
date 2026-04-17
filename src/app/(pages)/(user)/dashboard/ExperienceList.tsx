'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { showBookingUnavailable } from '@/utils/booking-unavailable';
type Experience = {
  id: number;
  experienceTitle: string;
  categoryTitle: string;
  pricing: { startingPrice: number | null };
  durationMin?: number;
  durationMax?: number;
  imageUrl?: string; // optional banner image
  isRecommended?: boolean; // optional ribbon flag
};

type DashboardResponse = {
  personality: { name: string; type?: string } | null;
  experiences: Experience[];
};

export default function ExperienceList() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExperiences() {
      try {
        const res = await fetch('/api/dashboard-experiences');
        const result: DashboardResponse = await res.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching experiences:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExperiences();
  }, []);

  if (loading) return <p className="text-gray-500">Loading experiences...</p>;
  if (!data || data.experiences.length === 0)
    return <p className="text-gray-500">No recommended experiences found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.experiences.map(exp => (
        <div
          key={exp.id}
          className="relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
        >
          {/* Optional Image */}
          {exp.imageUrl && (
            <div className="h-40 w-full overflow-hidden">
              {exp.imageUrl && (
                <div className="h-40 w-full overflow-hidden relative">
                  <Image
                    src={exp.imageUrl}
                    alt={exp.experienceTitle}
                    fill // makes image fill parent div
                    className="object-cover"
                    priority={exp.isRecommended} // optional: prioritize recommended images
                  />
                </div>
              )}
            </div>
          )}

          <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {exp.experienceTitle}
              </h3>

              {/* Category badge */}
              <span className="inline-block mt-1 text-xs font-medium px-2 py-1 bg-pink-100 text-pink-600 rounded-full">
                {exp.categoryTitle}
              </span>

              {/* Price & Duration */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-pink-600 font-semibold">
                  {exp.pricing?.startingPrice
                    ? `$${exp.pricing.startingPrice}`
                    : 'N/A'}
                </span>
                {exp.durationMin && exp.durationMax && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {exp.durationMin}-{exp.durationMax} min
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <Link
                href={`/dashboard/experiences/${exp.id}`}
                className="flex-1 text-center border border-pink-500 py-2 rounded-lg text-pink-500 font-semibold hover:bg-pink-50 text-sm transition-colors"
              >
                View Info
              </Link>
              <button
                type="button"
                onClick={() => showBookingUnavailable(exp.experienceTitle)}
                className="flex-1 text-center bg-linear-to-r from-pink-500 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 text-sm transition-all"
              >
                Book Now
              </button>
            </div>
          </div>

          {/* Recommended Ribbon */}
          {exp.isRecommended && (
            <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Recommended
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
