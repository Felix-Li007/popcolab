import type { ReactNode } from 'react';
import styles from '@/styles/dashboard/profile-card.module.css';

type ProfileCardProps = {
  tone: 'personal' | 'work';
  title: string;
  titleIcon: ReactNode;
  description: string;
  children: ReactNode;
};

export default function ProfileCard({
  tone,
  title,
  titleIcon,
  description,
  children,
}: Readonly<ProfileCardProps>) {
  const sectionToneClass =
    tone === 'personal' ? styles.cardPersonal : styles.cardWork;
  const iconToneClass =
    tone === 'personal' ? styles.iconPersonal : styles.iconWork;
  const badgeToneClass =
    tone === 'personal' ? styles.badgePersonal : styles.badgeWork;
  const badgeLabel = tone === 'personal' ? 'Personal capsule' : 'Work capsule';

  return (
    <section className={`${styles.card} ${sectionToneClass}`}>
      <div className={styles.cardGlow} />
      <div className={styles.header}>
        <span className={`${styles.badge} ${badgeToneClass}`}>
          {badgeLabel}
        </span>
        <h2 className={styles.title}>
          <span className={`${styles.icon} ${iconToneClass}`}>{titleIcon}</span>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}
