'use client';

import Link from 'next/link';

type ActionLink = {
  icon: React.ReactNode;
  label: string;
  href: string;
  tone: string;
};

const actions: ActionLink[] = [
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
    label: 'Experiences',
    href: '/admin/experiences',
    tone: 'border-coral-soft bg-rose-50 text-coral-red hover:border-coral-vibe/40 hover:bg-rose-100/70',
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z"
        />
      </svg>
    ),
    label: 'Requests',
    href: '/admin/requests',
    tone: 'border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100/70',
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h10M7 16h6M6 3h9l3 3v15a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"
        />
      </svg>
    ),
    label: 'Proposals',
    href: '/admin/proposals',
    tone: 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-100/70',
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
        />
      </svg>
    ),
    label: 'Questions',
    href: '/admin/questions',
    tone: 'border-purple-100 bg-purple-50 text-purple-700 hover:border-purple-200 hover:bg-purple-100/70',
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m10-8a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    label: 'Personalities',
    href: '/admin/personalities',
    tone: 'border-teal-100 bg-teal-50 text-teal-deep hover:border-teal-200 hover:bg-teal-100/70',
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7h16M4 12h16M4 17h16"
        />
      </svg>
    ),
    label: 'Dimensions',
    href: '/admin/dimensions',
    tone: 'border-sky-100 bg-sky-50 text-sky-700 hover:border-sky-200 hover:bg-sky-100/70',
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7l9-4 9 4-9 4-9-4zm0 0v6l9 4 9-4V7m-9 4v6"
        />
      </svg>
    ),
    label: 'Providers',
    href: '/admin/experiences/providers',
    tone: 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100',
  },
];

export default function QuickActions() {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-white/76 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(246,249,252,0.8))] p-4 shadow-[0_26px_52px_rgba(15,23,42,0.09),0_10px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl">
      <div className="pointer-events-none absolute left-4 top-2 h-10 w-24 rounded-full bg-white/55 blur-2xl" />
      <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => (
          <Link
            key={action.label}
            href={action.href}
            className={`group flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-[14px] border p-2.5 text-center shadow-[0_14px_28px_rgba(15,23,42,0.08),0_6px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl transition-all ${action.tone}`}
          >
            <span className="transition-transform group-hover:scale-110">
              {action.icon}
            </span>
            <span className="text-[10px] font-semibold leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
