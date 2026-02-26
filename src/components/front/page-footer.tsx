import styles from '@/styles/page-footer.module.css';

const supportLinks = [
  'Help Centre',
  'Privacy Policy',
  'Terms of Use',
  'popcolab.ca/',
];

const hours = ['Mon - Fri: 9am - 9pm', 'Sat: 10am - 4pm', 'Sun: Closed'];

export default function Footer() {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerWrapper}>
        {/* Location */}
        <div>
          <h4 className={styles.footerTitle}>Location</h4>
          <p>
            84 - 1 Leofard Ave.
            <br />
            Winnipeg, MB R3B 0O8
            <br />
            Richardson Centre Concourse
            <br />
            (Lower Level)
          </p>
        </div>

        {/* Hours */}
        <div>
          <h4 className={styles.footerTitle}>Hours</h4>
          <ul>
            {hours.map((hour, idx) => (
              <li key={idx}>{hour}</li>
            ))}
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h4 className={styles.footerTitle}>Support</h4>
          <ul>
            {supportLinks.map((link, idx) => (
              <li key={idx}>
                <a href="#" className={styles.footerLink}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className={styles.footerBottom}>
        <p>© 2024 Pop CoLab. All rights reserved.</p>
        <div className={styles.footerBottomLinks}>
          <a href="#" className={styles.footerLink}>
            Privacy
          </a>
          <a href="#" className={styles.footerLink}>
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
