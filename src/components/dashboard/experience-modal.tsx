'use client';

import ExperienceView from '@/components/admin/experience/experience-view';
import type { Experience } from '@/types/experience-type';

type Props = {
  experience: Experience;
  onClose: () => void;
};

export default function ExperienceModal({
  experience,
  onClose,
}: Readonly<Props>) {
  return (
    <ExperienceView
      isOpen
      experience={experience}
      onClose={onClose}
      onEdit={() => undefined}
      showEditButton={false}
    />
  );
}
