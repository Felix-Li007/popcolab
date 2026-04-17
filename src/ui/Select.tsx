import type { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

type SelectOption = {
  label: string;
  value: string;
};

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  ariaLabel?: string;
  defaultValue?: string;
  name?: string;
  options: SelectOption[];
};

export default function Select({
  ariaLabel,
  defaultValue,
  name,
  options,
  className,
  ...props
}: Readonly<Props>) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      className={[styles.select, className].filter(Boolean).join(' ')}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
