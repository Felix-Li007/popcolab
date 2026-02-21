import PersonalityCard from './personality-card';
import type { Personality } from '@/types/personality-type';
import styles from '@/styles/personality-card.module.css';

type PersonalityGridProps = {
  personalities: Personality[];
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number, name: string) => void;
};

export default function PersonalityGrid({
  personalities,
  onEdit,
  onView,
  onDelete,
}: PersonalityGridProps) {
  return (
    <div className={styles.cardGrid}>
      {personalities.map(p => (
        <PersonalityCard
          key={p.id}
          type={p.type}
          name={p.name}
          description={p.description}
          emoji={p.emoji}
          stars={p.stars}
          threshold={p.threshold}
          accentColor={p.accentColor}
          onEdit={() => onEdit(p.id!)}
          onView={() => onView(p.id!)}
          onDelete={() => onDelete(p.id!, p.name)}
        />
      ))}
    </div>
  );
}
