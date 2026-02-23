import '../styles/landing-Footer.css';

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
    <footer className="bg-[#19464d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo and Description */}
          <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff8de6] to-[#f52e81] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold">Pop CoLab</span>
            </div>
            <p className="text-white/80 leading-relaxed">
              Rediscover the Power of Play. Building trust one experience at a
              time.
            </p>
          </div>

          {/* Admin Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-[#ff8de6]">Admin</h4>
            <ul className="space-y-2">
              {adminLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition font-medium"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-[#ff8de6]">Support</h4>
            <ul className="space-y-2">
              {supportLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href="#"
                    className="text-white/80 hover:text-white transition font-medium"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Where to Find Us Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 py-12 border-t border-white/20">
          {/* Location */}
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-[#ff8de6]">Location</h4>
            <p className="text-white/80 text-sm leading-relaxed">
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
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-[#ff8de6]">Hours</h4>
            <ul className="text-white/80 text-sm space-y-1">
              {hours.map((hour, idx) => (
                <li key={idx}>{hour}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-lg text-[#ff8de6]">Contact</h4>
            <div className="text-white/80 text-sm space-y-2">
              <p>
                <a
                  href="mailto:hello@popcolab.ca"
                  className="hover:text-white transition"
                >
                  hello@popcolab.ca
                </a>
              </p>
              <p>
                <a href="#" className="hover:text-white transition">
                  @pop.colab
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/80 text-sm">
            © 2024 Pop CoLab. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-white/80 hover:text-white transition text-sm"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-white/80 hover:text-white transition text-sm"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
