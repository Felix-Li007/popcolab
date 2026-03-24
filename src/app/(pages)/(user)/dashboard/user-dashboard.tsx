'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Experience = {
  id: number;
  experienceTitle: string;
  category: {
    category_title: string;
  };
  description?: string;
  pricing: { startingPrice: number | null };
  durationMin?: number;
  durationMax?: number;
};

type Personality = {
  name: string;
  type?: string;
};

type DashboardData = {
  personality: Personality | null;
  experiences: Experience[]; // recommended
  allExperiences: Experience[]; // other admin experiences
};

export default function UserDashboardContent() {
  const [recommended, setRecommended] = useState<Experience[]>([]);
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null); // For modal

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard-experiences');
        const data: DashboardData = await res.json();
        setPersonality(data.personality);
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

  if (loading) return <p className="p-6">Loading dashboard...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome + Personality */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {personality?.name ?? 'User'} 👋
        </h1>
        {personality?.type && (
          <p className="text-gray-600 mt-1">Personality: {personality.type}</p>
        )}
      </div>

      {/* Recommended Experiences */}
      {recommended.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-teal-600 mb-3">
            Recommended for You
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map(exp => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                onView={() => setSelectedExp(exp)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Experiences */}
      {allExperiences.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mt-8 mb-3">Other Experiences</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allExperiences.map(exp => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                onView={() => setSelectedExp(exp)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedExp && (
        <ExperienceModal
          exp={selectedExp}
          onClose={() => setSelectedExp(null)}
        />
      )}
    </div>
  );
}

// --------- Card Component ---------
function ExperienceCard({
  exp,
  onView,
}: {
  exp: Experience;
  onView: () => void;
}) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow hover:shadow-lg transition-shadow flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-lg">{exp.experienceTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {exp.category?.category_title}
        </p>
        <p className="mt-2 font-semibold text-teal-600">
          ${exp.pricing?.startingPrice ?? 'N/A'}
        </p>
        {exp.durationMin && exp.durationMax && (
          <p className="text-sm text-gray-400 mt-1">
            Duration: {exp.durationMin}-{exp.durationMax} min
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onView}
          className="flex-1 py-2 px-4 bg-gray-200 rounded font-semibold hover:bg-gray-300"
        >
          View Info
        </button>
        <Link
          href={`/experiences/${exp.id}/checkout`}
          className="flex-1 py-2 px-4 bg-teal-500 text-white rounded font-semibold hover:bg-teal-600 text-center"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}

// --------- Modal Component ---------
function ExperienceModal({
  exp,
  onClose,
}: {
  exp: Experience;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-11/12 md:w-2/3 lg:w-1/3">
        <h2 className="text-xl font-bold mb-2">{exp.experienceTitle}</h2>
        <p className="text-gray-600 mb-1">
          <strong>Category:</strong> {exp.category?.category_title}
        </p>
        {exp.description && (
          <p className="text-gray-600 mb-2">
            <strong>Description:</strong> {exp.description}
          </p>
        )}
        {exp.durationMin && exp.durationMax && (
          <p className="text-gray-600 mb-1">
            <strong>Duration:</strong> {exp.durationMin}-{exp.durationMax} min
          </p>
        )}
        <p className="text-gray-600 mb-4">
          <strong>Price:</strong> ${exp.pricing?.startingPrice ?? 'N/A'}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          <Link
            href={`/experiences/${exp.id}/checkout`}
            className="py-2 px-4 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
