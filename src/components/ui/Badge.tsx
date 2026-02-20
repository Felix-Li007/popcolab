import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'personality';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-500',
  primary: 'bg-magenta text-white',
  secondary: 'bg-gray-200 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  personality: '', // Custom colors will be applied
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[9px] px-1.5 py-0.5',
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'sm',
      bgColor,
      textColor,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-block font-bold rounded-full';
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    // Custom colors override variant styles
    const customColorStyle =
      bgColor || textColor
        ? `${bgColor || ''} ${textColor || ''}`.trim()
        : variantStyle;

    const combinedClassName = [
      baseStyles,
      customColorStyle,
      sizeStyle,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
