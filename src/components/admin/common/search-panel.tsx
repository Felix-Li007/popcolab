'use client';

import Link from 'next/link';
import styles from '@/styles/search-panel.module.css';

type HiddenField = {
  name: string;
  value: string;
};

type InstantProps = {
  mode?: 'instant';
  searchValue: string;
  onSearchChange: (value: string) => void;
};

type SubmitProps = {
  mode: 'submit';
  formAction: string;
  method?: 'GET' | 'POST';
  defaultSearchValue: string;
  submitLabel?: string;
  clearHref?: string;
  hiddenFields?: HiddenField[];
  searchName?: string;
};

type Props = {
  title: string;
  searchPlaceholder: string;
  searchTestId?: string;
  actions?: React.ReactNode;
} & (InstantProps | SubmitProps);

export default function SearchPanel({
  title,
  searchPlaceholder,
  searchTestId,
  actions,
  ...searchMode
}: Props) {
  const isSubmitMode = searchMode.mode === 'submit';

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <span className={styles.title}>{title}</span>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      {isSubmitMode ? (
        <form
          action={searchMode.formAction}
          method={searchMode.method ?? 'GET'}
          className={styles.searchForm}
        >
          <input
            type="search"
            name={searchMode.searchName ?? 'q'}
            defaultValue={searchMode.defaultSearchValue}
            placeholder={searchPlaceholder}
            data-testid={searchTestId}
            className={styles.submitInput}
          />
          {(searchMode.hiddenFields ?? []).map(field => (
            <input
              key={`${field.name}-${field.value}`}
              type="hidden"
              name={field.name}
              value={field.value}
            />
          ))}
          <button type="submit" className={styles.submitButton}>
            {searchMode.submitLabel ?? 'Search'}
          </button>
          {searchMode.clearHref ? (
            <Link href={searchMode.clearHref} className={styles.clearLink}>
              Clear
            </Link>
          ) : null}
        </form>
      ) : (
        <div className={styles.searchWrap}>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={styles.searchIcon}
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={searchMode.searchValue}
            onChange={event => searchMode.onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            data-testid={searchTestId}
            className={styles.searchInput}
          />
        </div>
      )}
    </div>
  );
}
