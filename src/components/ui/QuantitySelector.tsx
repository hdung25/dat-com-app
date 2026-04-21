'use client';

import React from 'react';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export default function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Decrease */}
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 text-white text-xl font-bold
          flex items-center justify-center btn-press shadow-md shadow-cyan-200/60
          disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
          hover:from-cyan-700 hover:to-sky-700 transition-all"
        aria-label="Giảm số lượng"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 12h14"/>
        </svg>
      </button>

      {/* Count */}
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="text-3xl font-extrabold text-cyan-700 leading-none">{value}</span>
        <span className="text-xs text-slate-400 mt-0.5">phần</span>
      </div>

      {/* Increase */}
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-sky-600 text-white text-xl font-bold
          flex items-center justify-center btn-press shadow-md shadow-cyan-200/60
          disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
          hover:from-cyan-700 hover:to-sky-700 transition-all"
        aria-label="Tăng số lượng"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
  );
}
