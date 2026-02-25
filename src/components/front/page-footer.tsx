import '@/styles/page-Footer.css';

const adminLinks = [
  'Dashboard',
  'Dimensions',
  'Personalities',
  'Questions',
  'Events',
  'Bookings',
  'Settings',
];

const supportLinks = [
  'Help Centre',
  'Privacy Policy',
  'Terms of Use',
  'popcolab.ca/',
];

const hours = ['Mon - Fri: 9am - 9pm', 'Sat: 10am - 4pm', 'Sun: Closed'];

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-wrapper">
        {/* Location */}
        <div>
          <h4 className="footer-title">Location</h4>
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
          <h4 className="footer-title">Hours</h4>
          <ul>
            {hours.map((hour, idx) => (
              <li key={idx}>{hour}</li>
            ))}
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h4 className="footer-title">Support</h4>
          <ul>
            {supportLinks.map((link, idx) => (
              <li key={idx}>
                <a href="#" className="footer-link">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="footer-bottom">
        <p>© 2024 Pop CoLab. All rights reserved.</p>
        <div className="flex gap-4 justify-center mt-2">
          <a href="#" className="footer-link">
            Privacy
          </a>
          <a href="#" className="footer-link">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
