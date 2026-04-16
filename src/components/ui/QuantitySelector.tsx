'use client';

import React from 'react';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export default function QuantitySelector({ value, min = 1, max, onChange }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold
          flex items-center justify-center btn-press
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:bg-primary-dark transition-colors"
        aria-label="Giảm số lượng"
      >
        −
      </button>
      <span className="text-2xl font-bold text-text-primary w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold
          flex items-center justify-center btn-press
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:bg-primary-dark transition-colors"
        aria-label="Tăng số lượng"
      >
        +
      </button>
    </div>
  );
}
