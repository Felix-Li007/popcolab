import Link from 'next/link';

const adminLinks = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Personalities', href: '/admin/personalities' },
  { label: 'Surveys', href: '/admin/quiz' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Bookings', href: '/admin/bookings' },
  { label: 'Settings', href: '/admin/settings' },
];

const supportLinks = [
  { label: 'Help Centre', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
  { label: 'popcolab.ca ↗', href: 'https://popcolab.ca', external: true },
];

export default function AdminFooter() {
  return (
    <footer className="bg-teal-deep text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-magenta to-pink-bright flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <span className="font-bold text-sm">Pop CoLab</span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              Rediscover the Power of Play.
              <br />
              Building trust one experience at a time.
            </p>
            <div className="flex gap-3 mt-4">
              {['facebook', 'instagram', 'twitter', 'linkedin'].map(s => (
                <a
                  key={s}
                  href="#"
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label={s}
                >
                  <span className="text-[10px]">●</span>
                </a>
              ))}
            </div>
          </div>

          {/* Admin links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Admin
            </h4>
            <ul className="space-y-1.5">
              {adminLinks.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Support
            </h4>
            <ul className="space-y-1.5">
              {supportLinks.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-xs text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Where to Find Us
            </h4>
            <div className="space-y-3 text-xs text-white/70">
              <div>
                <p className="font-semibold text-white/90 mb-0.5">Location</p>
                <p>R4 – 1 Lombard Ave.</p>
                <p>Winnipeg, MB R3B 0X8</p>
                <p>Richardson Centre Concourse</p>
                <p className="text-white/50">(Lower Level)</p>
              </div>
              <div>
                <p className="font-semibold text-white/90 mb-0.5">Hours</p>
                <p>Mon – Fri: 9am – 6pm</p>
                <p>Sat: 10am – 4pm</p>
                <p>Sun: Closed</p>
              </div>
              <div>
                <p className="font-semibold text-white/90 mb-0.5">Contact</p>
                <a
                  href="mailto:hello@popcolab.ca"
                  className="hover:text-white transition-colors"
                >
                  hello@popcolab.ca
                </a>
                <br />
                <a
                  href="mailto:@pop.colab"
                  className="hover:text-white transition-colors"
                >
                  @pop.colab
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-white/40">
          <span>©2026 Pop CoLab · Admin Panel v2.4.1</span>
          <div className="flex gap-3">
            <a href="#" className="hover:text-white/70 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white/70 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
