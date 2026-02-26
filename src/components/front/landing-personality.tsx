import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from '@/styles/landing-hero.module.css';

const personalities = [
  {
    id: 1,
    name: 'Creator',
    color: '#ffbbf0',
    icon: '🎨',
    textColor: '#19464d',
  },
  {
    id: 2,
    name: 'Inspirer',
    color: '#f9dbf2',
    icon: '✨',
    textColor: '#19464d',
  },
  {
    id: 3,
    name: 'Companion',
    color: '#f5dd42',
    icon: '🤗',
    textColor: '#19464d',
  },
  {
    id: 4,
    name: 'Connector',
    color: '#ffa4eb',
    icon: '🤝',
    textColor: 'white',
  },
];

export default function HeroSection() {
  return (
    <section className={styles['hero-section']}>
      <div className={styles['hero-container']}>
        <div className={styles['hero-grid']}>
          {/* Left Column */}
          <div className={styles['hero-content']}>
            {/* Badge */}
            <div className={styles['hero-badge']}>
              <span>Free Assessment</span>
            </div>

            {/* Main Heading */}
            <div className={styles['hero-heading']}>
              <h1 className={styles['hero-title']}>
                Discover Your
                <br />
                Play Personality
              </h1>
              <p className={styles['hero-description']}>
                Find out how you play best. Take our 2-minute assessment and
                discover your unique play style — no sign up required.
              </p>
            </div>

            {/* CTA Button */}
            <div className={styles['hero-cta']}>
              <Link href="/test" className={styles['hero-button']}>
                Take the Quiz
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Features */}
            <div className={styles['hero-features']}>
              <div className={styles['hero-feature']}>
                <span className={styles['hero-feature-dot']}>●</span>
                <span className={styles['hero-feature-text']}>
                  No account needed
                </span>
              </div>
              <div className={styles['hero-feature']}>
                <span className={styles['hero-feature-dot']}>●</span>
                <span className={styles['hero-feature-text']}>
                  Only 2 minutes
                </span>
              </div>
              <div className={styles['hero-feature']}>
                <span className={styles['hero-feature-dot']}>●</span>
                <span className={styles['hero-feature-text']}>
                  Instant results
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Personality Grid */}
          <div className={styles['hero-grid-right']}>
            {/* Center circle with question mark */}
            <div className={styles['hero-center-circle']}>
              <span>?</span>
            </div>

            {/* Personality Cards arranged in grid */}
            <div className={styles['hero-cards-grid']}>
              {/* Creator */}
              <div
                className={styles['hero-card']}
                style={{ backgroundColor: personalities[0].color }}
              >
                <span className={styles['hero-card-icon']}>
                  {personalities[0].icon}
                </span>
                <h3
                  className={styles['hero-card-name']}
                  style={{ color: personalities[0].textColor }}
                >
                  {personalities[0].name}
                </h3>
                <p
                  className={styles['hero-card-subtitle']}
                  style={{ color: personalities[0].textColor }}
                >
                  Unique Strengths
                </p>
              </div>

              {/* Inspirer */}
              <div
                className={styles['hero-card']}
                style={{ backgroundColor: personalities[1].color }}
              >
                <span className={styles['hero-card-icon']}>
                  {personalities[1].icon}
                </span>
                <h3
                  className={styles['hero-card-name']}
                  style={{ color: personalities[1].textColor }}
                >
                  {personalities[1].name}
                </h3>
                <p
                  className={styles['hero-card-subtitle']}
                  style={{ color: personalities[1].textColor }}
                >
                  Unique Strengths
                </p>
              </div>

              {/* Companion */}
              <div
                className={styles['hero-card']}
                style={{ backgroundColor: personalities[2].color }}
              >
                <span className={styles['hero-card-icon']}>
                  {personalities[2].icon}
                </span>
                <h3
                  className={styles['hero-card-name']}
                  style={{ color: personalities[2].textColor }}
                >
                  {personalities[2].name}
                </h3>
                <p
                  className={styles['hero-card-subtitle']}
                  style={{ color: personalities[2].textColor }}
                >
                  Unique Strengths
                </p>
              </div>

              {/* Connector */}
              <div
                className={styles['hero-card']}
                style={{ backgroundColor: personalities[3].color }}
              >
                <span className={styles['hero-card-icon']}>
                  {personalities[3].icon}
                </span>
                <h3
                  className={styles['hero-card-name']}
                  style={{ color: personalities[3].textColor }}
                >
                  {personalities[3].name}
                </h3>
                <p
                  className={styles['hero-card-subtitle']}
                  style={{ color: personalities[3].textColor }}
                >
                  Unique Strengths
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
