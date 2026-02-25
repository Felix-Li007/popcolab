import Link from 'next/link';
import Image from 'next/image';
import { MenuItem } from '@/types/menu-item';

const adminLinks: MenuItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Dimensions', href: '/admin/dimensions' },
  { label: 'Personalities', href: '/admin/personalities' },
  { label: 'Questions', href: '/admin/questions' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Bookings', href: '/admin/bookings' },
  { label: 'Settings', href: '/admin/settings' },
];

const supportLinks: MenuItem[] = [
  { label: 'Help Centre', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
  { label: 'popcolab.ca ↗', href: 'https://popcolab.ca', external: true },
];

export default function PageFooter() {
  return (
    <footer className="bg-teal-deep text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/logo/logo-icon.png"
                alt="Pop CoLab"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-bold text-sm">Pop CoLab</span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              Rediscover the Power of Play.
              <br />
              Building trust one experience at a time.
            </p>
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
                  href="mailto:xxx@pop.colab"
                  className="hover:text-white transition-colors"
                >
                  xxx@pop.colab
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-white/40">
          <span>©2026 Pop CoLab</span>
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
