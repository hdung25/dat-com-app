'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  rightElement,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full px-4 py-3 text-base bg-white border-2 rounded-xl transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            placeholder:text-gray-400
            ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border'}
            ${rightElement ? 'pr-12' : ''}
            ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error flex items-center gap-1">
          <span>❌</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-text-secondary">{hint}</p>
      )}
    </div>
  );
}
