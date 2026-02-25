import '@/styles/landing-EventsSection.css';
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
    <section className="events-section">
      <div className="events-container">
        {/* Section Header */}
        <div className="events-header">
          <h2 className="events-title">Want to see more?</h2>
          <a href="#" className="events-link">
            Find more Events →
          </a>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {events.map(event => (
            <div
              key={event.id}
              className="event-card"
              style={{ backgroundColor: event.bgColor }}
            >
              {/* Event Number */}
              <div className="event-number">{event.number}</div>

              {/* Image Area */}
              <div className="event-image">{event.image}</div>

              {/* Content */}
              <div className="event-content">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-description">{event.description}</p>
              </div>

              {/* Learn More Link */}
              <div className="event-link-wrapper">
                <a href="#" className="event-link">
                  Learn More →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
