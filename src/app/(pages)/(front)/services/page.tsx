import styles from '@/styles/services.module.css';

export default function Services() {
  const services = [
    {
      icon: '🎭',
      title: 'Team Building Experiences',
      description:
        'Transform your team dynamics with engaging personality-based activities and workshops.',
      features: [
        'Customized team personality assessments',
        'Interactive team-building workshops',
        'Real-time collaboration exercises',
        'Post-experience team reports',
      ],
      price: 'Starting at $250',
    },
    {
      icon: '💼',
      title: 'Corporate Workshops',
      description:
        'Unlock team potential through our signature Pop CoLab corporate programs.',
      features: [
        'Leadership development sessions',
        'Cross-team collaboration training',
        'Communication skill enhancement',
        'Personalized coaching insights',
      ],
      price: 'Starting at $250',
    },
    {
      icon: '🎨',
      title: 'Creative Sessions',
      description:
        'Spark innovation with personality-driven creative collaboration sessions.',
      features: [
        'Ideation workshops',
        'Design thinking sprints',
        'Creative team challenges',
        'Innovation acceleration programs',
      ],
      price: 'Starting at $300',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className={styles['services-hero']}>
          <div className={styles['services-hero-content']}>
            <h1 className={styles['services-hero-title']}>Our Services</h1>
            <p className={styles['services-hero-subtitle']}>
              Find the perfect experience for your team, company, or event
            </p>
          </div>
        </section>

        {/* Introduction */}
        <section className={styles['services-intro']}>
          <div className={styles['intro-container']}>
            <h2 className={styles['intro-title']}>
              Tailored Experiences for Every Need
            </h2>
            <p className={styles['intro-text']}>
              Whether you are looking to strengthen team bonds, unlock creative
              potential, or build a more collaborative culture, Pop CoLab offers
              customized solutions designed to meet your specific goals and
              objectives.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className={styles['services-grid-section']}>
          <div className={styles['services-grid']}>
            {services.map(service => (
              <div key={service.title} className={styles['service-card']}>
                <div className={styles['service-icon']}>{service.icon}</div>
                <h3 className={styles['service-title']}>{service.title}</h3>
                <p className={styles['service-description']}>
                  {service.description}
                </p>

                <div className={styles['service-features']}>
                  <h4 className={styles['features-title']}>Includes:</h4>
                  <ul className={styles['features-list']}>
                    {service.features.map(feature => (
                      <li key={feature} className={styles['feature-item']}>
                        <span className={styles['feature-check']}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles['service-price']}>{service.price}</div>
                <button className={styles['service-btn']}>Learn More</button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles['services-cta']}>
          <h2 className={styles['cta-title']}>Ready to Get Started?</h2>
          <p className={styles['cta-text']}>
            Contact us today for a free consultation
          </p>
          <button className={styles['cta-button']}>
            Schedule a Consultation
          </button>
        </section>
      </main>
    </div>
  );
}
