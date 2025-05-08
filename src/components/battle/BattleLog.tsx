// src/components/battle/BattleLog.tsx
import React, { useEffect, useRef } from 'react';

// Define and export FormattedLogEntry
export interface FormattedLogEntry {
  id: string;
  text: string;
  styleType: 'player' | 'enemy' | 'neutral' | 'system' | 'buff' | 'debuff' | 'status';
}

interface BattleLogProps {
  entries: FormattedLogEntry[];
}

export function BattleLog({ entries }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new entries are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="battle-log-container" style={{ 
        border: '1px solid #444', 
        padding: '10px', 
        height: '100%', // Make it take full height of its column
        maxHeight: '300px', // User previously set this, keeping it
        overflowY: 'auto', 
        background: '#22252e',
        borderRadius: '4px',
        boxSizing: 'border-box' // Ensure padding/border are within height
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#eee', fontSize: '1.1em' }}>Battle Log</h3>
      {entries.map((entry) => (
        <div 
          key={entry.id} 
          className={`log-entry log-${entry.styleType}`}
          style={{ marginBottom: '4px', lineHeight: '1.4' }} // Basic styling for each entry
        >
          {entry.text}
        </div>
      ))}
      {/* Invisible element to target for scrolling */}
      <div ref={logEndRef} />
    </div>
  );
}