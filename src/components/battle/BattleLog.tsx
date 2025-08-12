// src/components/battle/BattleLog.tsx
import React, { useEffect, useRef } from 'react';

interface BattleLogProps {
  entries: string[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="battle-log" style={{ marginTop: 24 }}>
      <h4>Battle Log</h4>
      <div className="log-entries" style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #2a2f47', padding: '10px', borderRadius: '8px', background: '#111425' }}>
        {entries.length === 0 && <p><i>Battle Start!</i></p>}
        {entries.map((entry, i) => (
          <p key={i} style={{ lineHeight: 1.45 }}>{entry}</p>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}