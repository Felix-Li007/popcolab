'use client';

import Link from 'next/link';

type Props = {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  prevHref?: string;
  nextHref?: string;
  variant?: 'default' | 'circle';
};

const VARIANT_STYLES = {
  default: {
    wrap: 'px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0',
    button:
      'w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors',
    icon: 'w-5 h-5',
    label: 'text-badge font-semibold text-foreground/65',
  },
  circle: {
    wrap: 'px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0',
    button:
      'w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors',
    icon: 'w-5 h-5',
    label: 'text-badge font-semibold text-foreground/65',
  },
} as const;

function PrevIcon({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NextIcon({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PaginationBar({
  page,
  totalPages,
  onPageChange,
  prevHref,
  nextHref,
  variant = 'default',
}: Readonly<Props>) {
  if (totalPages <= 1) return null;

  const variantStyles = VARIANT_STYLES[variant];
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  function renderPrev() {
    if (onPageChange) {
      return (
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={prevDisabled}
          title="Previous page"
          className={`${variantStyles.button} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <PrevIcon className={variantStyles.icon} />
        </button>
      );
    }

    if (!prevDisabled && prevHref) {
      return (
        <Link
          href={prevHref}
          title="Previous page"
          className={variantStyles.button}
        >
          <PrevIcon className={variantStyles.icon} />
        </Link>
      );
    }

    return (
      <span
        className={`${variantStyles.button} pointer-events-none opacity-30`}
        aria-hidden="true"
      >
        <PrevIcon className={variantStyles.icon} />
      </span>
    );
  }

  function renderNext() {
    if (onPageChange) {
      return (
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={nextDisabled}
          title="Next page"
          className={`${variantStyles.button} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <NextIcon className={variantStyles.icon} />
        </button>
      );
    }

    if (!nextDisabled && nextHref) {
      return (
        <Link
          href={nextHref}
          title="Next page"
          className={variantStyles.button}
        >
          <NextIcon className={variantStyles.icon} />
        </Link>
      );
    }

    return (
      <span
        className={`${variantStyles.button} pointer-events-none opacity-30`}
        aria-hidden="true"
      >
        <NextIcon className={variantStyles.icon} />
      </span>
    );
  }

  return (
    <div className={variantStyles.wrap}>
      {renderPrev()}

      <span className={variantStyles.label}>
        {page} / {totalPages}
      </span>

      {renderNext()}
    </div>
  );
}
