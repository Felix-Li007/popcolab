import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: InputSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: InputSize;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-4 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      inputSize = 'md',
      icon,
      fullWidth = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = props.id ?? generatedId;
    const baseStyles =
      'font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder:font-normal placeholder-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50';
    const sizeStyle = sizeStyles[inputSize];
    const errorStyle = error ? 'ring-2 ring-red-300 bg-red-50' : '';
    const widthStyle = fullWidth ? 'w-full' : '';

    const combinedClassName = [
      baseStyles,
      sizeStyle,
      errorStyle,
      widthStyle,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`${combinedClassName} ${icon ? 'pl-11' : ''}`}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[10px] text-gray-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      inputSize = 'md',
      fullWidth = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = props.id ?? generatedId;
    const baseStyles =
      'font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder:font-normal placeholder-gray-400 resize-none transition leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50';
    const sizeStyle = sizeStyles[inputSize];
    const errorStyle = error ? 'ring-2 ring-red-300 bg-red-50' : '';
    const widthStyle = fullWidth ? 'w-full' : '';

    const combinedClassName = [
      baseStyles,
      sizeStyle,
      errorStyle,
      widthStyle,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={combinedClassName}
          {...props}
        />
        {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[10px] text-gray-400 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default Input;
