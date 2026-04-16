import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden
        ${hover ? 'card-press cursor-pointer' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
