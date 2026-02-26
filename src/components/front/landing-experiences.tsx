'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/landing-experience.module.css';

const experiences = [
  {
    id: 1,
    title: 'Zero-proof Cocktail Experience',
    subtitle:
      'Stir Up Creativity: Non-Alcoholic Cocktail Workshops Using Premium Spirits and Products from Solar Market!',
    description:
      'Welcome to the Pop CoLab Zero-Proof Cocktail Experience – a hands-on, alcohol-free tasting that blends inclusivity, wellness, and creativity.',
    image: '/images/Cocktail.png',
  },
  {
    id: 2,
    title: 'Team Building Workshop',
    subtitle: 'Strengthen Your Team Bond Through Creative Play',
    description:
      'Experience our innovative team building workshop designed to enhance communication and foster stronger workplace connections.',
    image: '/images/team-building.png',
  },
  {
    id: 3,
    title: 'Creative Workshop',
    subtitle: 'Unlock Your Creative Potential',
    description:
      'Join us for an immersive creative session that blends art, play, and personal discovery.',
    image: '/images/Workshop.png',
  },
];

export default function ExperiencesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? experiences.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === experiences.length - 1 ? 0 : prev + 1));
  };

  const current = experiences[currentIndex];

  return (
    <section className={styles['experiences-carousel']}>
      <div className={styles['carousel-container']}>
        <p className={styles['carousel-label']}>Most Played Experiences</p>

        <div className={styles['carousel-content']}>
          {/* Left Arrow */}
          <button
            onClick={goToPrevious}
            className={styles['carousel-arrow']}
            aria-label="Previous experience"
          >
            <ChevronLeft />
          </button>

          {/* Carousel Inner */}
          <div className={styles['carousel-inner']}>
            <div className={styles['carousel-image']}>
              <Image
                src={current.image}
                alt={current.title}
                width={320} // set explicit width
                height={220} // set explicit height
                className={styles['carousel-img']}
                style={{ objectFit: 'cover' }}
              />
            </div>

            <div className={styles['carousel-text']}>
              <div className={styles['carousel-heading']}>
                <h2 className={styles['carousel-title']}>{current.title}</h2>
                <p className={styles['carousel-subtitle']}>
                  {current.subtitle}
                </p>
              </div>

              <p className={styles['carousel-description']}>
                {current.description}
              </p>

              <button className={styles['carousel-button']}>Learn More</button>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className={styles['carousel-arrow']}
            aria-label="Next experience"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className={styles['carousel-pagination']}>
          {experiences.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`${styles['pagination-dot']} ${idx === currentIndex ? styles.active : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
