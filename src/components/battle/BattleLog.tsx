// src/components/battle/BattleLog.tsx
import React, { useEffect, useRef } from 'react';

interface BattleLogProps {
  entries: string[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new entries are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="battle-log" style={{ marginTop: 24 }}>
      <h4>Battle Log</h4>
      <div className="log-entries" style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #444', padding: '8px', borderRadius: '4px' }}>
        {entries.length === 0 && <p><i>Battle Start!</i></p>}
        {entries.map((entry, i) => (
          <p key={i}>{entry}</p>
        ))}
        {/* Invisible element to target for scrolling */}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}