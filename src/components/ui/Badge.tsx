import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  primary: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200',
  success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  gray: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full
        ${variantClasses[variant]}
        ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${className}`}
    >
      {children}
    </span>
  );
}
