import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const alertStyles = {
  success: {
    bg: 'bg-success-light',
    border: 'border-success',
    text: 'text-green-800',
  },
  error: {
    bg: 'bg-error-light',
    border: 'border-error',
    text: 'text-red-800',
  },
  warning: {
    bg: 'bg-warning-light',
    border: 'border-warning',
    text: 'text-amber-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
  },
};

export default function Alert({ type, children, className = '' }: AlertProps) {
  const styles = alertStyles[type];

  return (
    <div className={`${styles.bg} ${styles.text} border-l-4 ${styles.border} rounded-xl p-4 animate-scale-in ${className}`}>
      <div className="flex items-start gap-2 text-sm font-medium">
        {children}
      </div>
    </div>
  );
}
