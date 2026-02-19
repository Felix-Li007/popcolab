import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'text'
  | 'icon'
  | 'tab';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isActive?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-magenta text-white hover:bg-teal-deep shadow-sm hover:scale-[1.01] active:scale-[0.98] font-bold',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-semibold',
  ghost:
    'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 font-semibold',
  text: 'bg-transparent text-gray-500 hover:text-magenta font-normal',
  icon: 'bg-white/80 hover:bg-white border border-pink-light/60 text-gray-400 hover:text-magenta',
  tab: 'text-gray-500 hover:bg-gray-100 font-semibold',
};

const activeTabStyle = 'bg-teal-deep text-white';

// 所有按钮统一高度为 h-10 (40px)，只通过水平 padding 区分尺寸，设置最小宽度确保视觉平衡
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-10 min-w-[60px] px-3 text-xs gap-1',
  sm: 'h-10 min-w-[80px] px-4 text-xs gap-1.5',
  md: 'h-10 min-w-[100px] px-6 text-sm gap-2',
  lg: 'h-10 min-w-[120px] px-8 text-base gap-2.5',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-10 h-10 p-2',
  sm: 'w-10 h-10 p-2',
  md: 'w-10 h-10 p-2',
  lg: 'w-12 h-12 p-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isActive = false,
      icon,
      children,
      fullWidth = false,
      className = '',
      disabled = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isIconOnly = icon && !children;
    const isTab = variant === 'tab';

    const baseStyles = 'inline-flex items-center justify-center transition-all';
    const roundedStyle = isIconOnly ? 'rounded-full' : 'rounded-full';
    const disabledStyle = disabled
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : '';
    const widthStyle = fullWidth ? 'w-full' : '';

    const variantStyle =
      isTab && isActive ? activeTabStyle : variantStyles[variant];
    const sizeStyle = isIconOnly ? iconSizeStyles[size] : sizeStyles[size];

    const combinedClassName = [
      baseStyles,
      roundedStyle,
      variantStyle,
      sizeStyle,
      disabledStyle,
      widthStyle,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={combinedClassName}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
