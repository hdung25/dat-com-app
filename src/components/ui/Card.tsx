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
      className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden
        ${hover ? 'card-press cursor-pointer hover:shadow-md hover:shadow-cyan-100/60' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
