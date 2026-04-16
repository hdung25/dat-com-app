import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
};

export default function Badge({ children, variant = 'primary', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-semibold rounded-full
      ${variantClasses[variant]}
      ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      ${className}`}
    >
      {children}
    </span>
  );
}
