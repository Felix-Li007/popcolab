import styles from '@/styles/landing-events.module.css';
const events = [
  {
    id: 1,
    number: '1',
    title: 'Corporate Teams',
    description: 'Build stronger workplace cultures',
    image: '👥',
    bgColor: '#f9dbd2',
  },
  {
    id: 2,
    number: '2',
    title: 'Public Groups',
    description: 'For teams, groups and curious members.',
    image: '🎭',
    bgColor: '#f9dbf2',
  },
  {
    id: 3,
    number: '3',
    title: 'Upcoming Events',
    description: 'See what is coming up in the community',
    image: '🎉',
    bgColor: '#fcf9e4',
  },
];

export default function EventsSection() {
  return (
    <section className={styles['events-section']}>
      <div className={styles['events-container']}>
        {/* Section Header */}
        <div className={styles['events-header']}>
          <h2 className={styles['events-title']}>Want to see more?</h2>
          <button type="button" className={styles['events-link']}>
            Find more Events →
          </button>
        </div>

        {/* Events Grid */}
        <div className={styles['events-grid']}>
          {events.map(event => (
            <div
              key={event.id}
              className={styles['event-card']}
              style={{ backgroundColor: event.bgColor }}
            >
              {/* Event Number */}
              <div className={styles['event-number']}>{event.number}</div>

              {/* Image Area */}
              <div className={styles['event-image']}>{event.image}</div>

              {/* Content */}
              <div className={styles['event-content']}>
                <h3 className={styles['event-title']}>{event.title}</h3>
                <p className={styles['event-description']}>
                  {event.description}
                </p>
              </div>

              {/* Learn More Link */}
              <div className={styles['event-link-wrapper']}>
                <button type="button" className={styles['event-link']}>
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
