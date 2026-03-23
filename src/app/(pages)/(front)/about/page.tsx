import styles from '@/styles/about.module.css';
import Image from 'next/image';

export default function About() {
  const values = [
    {
      icon: '💡',
      title: 'Innovation',
      description:
        'We embrace creativity and fresh perspectives to solve challenges',
    },
    {
      icon: '🤝',
      title: 'Collaboration',
      description:
        'Teamwork makes the dream work - we believe in collective growth',
    },
    {
      icon: '🎯',
      title: 'Authenticity',
      description: 'Be true to yourself and celebrate what makes you unique',
    },
    {
      icon: '🌟',
      title: 'Excellence',
      description: 'We strive for the highest standards in everything we do',
    },
  ];

  const team = [
    {
      name: 'Alex Chen',
      role: 'Founder & CEO',
      bio: 'Creative strategist with 10+ years in personality development',
    },
    {
      name: 'Jordan Smith',
      role: 'Head of Experience',
      bio: 'Expert in designing immersive learning experiences',
    },
    {
      name: 'Casey Williams',
      role: 'Creative Director',
      bio: 'Bringing Pop CoLab vibrant vision to life',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className={styles['about-hero']}>
          <div className={styles['about-hero-content']}>
            <h1 className={styles['about-hero-title']}>About Pop CoLab</h1>
            <p className={styles['about-hero-subtitle']}>
              Discover the power of personality-driven collaboration
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className={styles['about-story']}>
          <div className={styles['story-container']}>
            <div className={styles['story-text']}>
              <h2 className={styles['story-title']}>Our Story</h2>
              <p className={styles['story-paragraph']}>
                Pop CoLab was born from a simple belief: when people understand
                themselves and others better, magic happens. We created a
                platform where playful personality discovery meets meaningful
                collaboration.
              </p>
              <p className={styles['story-paragraph']}>
                Founded in 2023, we have been on a mission to transform how
                teams connect, communicate, and create together. From corporate
                teams to creative communities, Pop CoLab has helped thousands of
                people unlock their unique strengths.
              </p>
            </div>
            <div className={styles['story-image']}>
              <Image
                src="/images/image.png"
                alt="About Pop CoLab"
                width={700}
                height={700}
                className={styles['story-image-real']}
              />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles['about-values']}>
          <h2 className={styles['values-title']}>Our Values</h2>
          <div className={styles['values-grid']}>
            {values.map(value => (
              <div key={value.title} className={styles['value-card']}>
                <div className={styles['value-icon']}>{value.icon}</div>
                <h3 className={styles['value-name']}>{value.title}</h3>
                <p className={styles['value-description']}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className={styles['about-team']}>
          <h2 className={styles['team-title']}>Meet the Team</h2>
          <div className={styles['team-grid']}>
            {team.map(member => (
              <div key={member.name} className={styles['team-card']}>
                <div className={styles['team-avatar']}>👤</div>
                <h3 className={styles['team-name']}>{member.name}</h3>
                <p className={styles['team-role']}>{member.role}</p>
                <p className={styles['team-bio']}>{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles['about-stats']}>
          <div className={styles['stats-grid']}>
            <div className={styles['stat-card']}>
              <div className={styles['stat-number']}>10,000+</div>
              <div className={styles['stat-label']}>Assessments Completed</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-number']}>98%</div>
              <div className={styles['stat-label']}>User Satisfaction</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-number']}>4.9★</div>
              <div className={styles['stat-label']}>Average Rating</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
