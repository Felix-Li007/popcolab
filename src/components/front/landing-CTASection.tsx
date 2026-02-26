import styles from '@/styles/landing-ctasection.module.css';

export default function CTASection() {
  return (
    <section className={styles.section}>
      {/* Decorative elements */}
      <div className={styles.pinkCircle} />
      <div className={styles.lightCircle} />

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Main Heading */}
          <h2 className={styles.heading}>Ready to discover how you play?</h2>

          {/* Subheading */}
          <p className={styles.subheading}>
            Join thousands who have uncovered their unique play personality
          </p>

          {/* CTA Buttons */}
          <div className={styles.actions}>
            <button className={styles.primaryButton}>
              Start Assessment Now
            </button>
            <button className={styles.secondaryButton}>Learn More</button>
          </div>

          {/* Trust badges */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>10k+</div>
              <div className={styles.statLabel}>Assessments Completed</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>98%</div>
              <div className={styles.statLabel}>Satisfaction Rate</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>4.9⭐</div>
              <div className={styles.statLabel}>Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
