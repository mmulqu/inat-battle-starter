// src/components/battle/HPBar.tsx
import React from 'react';

interface HPBarProps {
  currentHp: number;
  maxHp: number;
}

export function HPBar({ currentHp, maxHp }: HPBarProps) {
  // Prevent division by zero and handle cases where maxHp might be missing
  const max = Math.max(1, maxHp);
  const current = Math.max(0, currentHp);
  const percentage = (current / max) * 100;

  return (
    <div className="hp-bar">
      <div
        className="hp-fill"
        style={{ width: `${percentage}%` }}
        title={`${current} / ${max} HP`} // Add tooltip for exact values
      />
    </div>
  );
}