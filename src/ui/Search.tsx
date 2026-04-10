import React from 'react';
import { Button } from './Button';

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  buttonLabel?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  iconClassName?: string;
  buttonType?: 'button' | 'submit';
}

export default function Search({
  buttonLabel = 'Search',
  wrapperClassName = '',
  inputClassName = '',
  buttonClassName = '',
  iconClassName = '',
  buttonType = 'submit',
  className = '',
  ...props
}: Readonly<SearchInputProps>) {
  return (
    <div className={wrapperClassName}>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className={iconClassName}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="text"
        className={`${inputClassName} ${className}`.trim()}
        {...props}
      />
      <Button
        type={buttonType}
        variant="primary"
        size="sm"
        className={buttonClassName}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
