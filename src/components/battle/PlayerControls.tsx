// src/components/battle/PlayerControls.tsx
import React from 'react';
import { moves, MoveId } from '../../data/moves'; // Import MoveId
import { Combatant } from '../../battle/engine';

interface PlayerControlsProps {
  playerCombatant: Combatant;
  onMoveSelect: (moveKey: MoveId) => void; // Use MoveId type
  onSwapInitiate: () => void; // New prop for initiating swap
  canSwap: boolean; // New prop to enable/disable swap button
  disabled?: boolean; // To disable buttons during enemy turn/animations
}

export function PlayerControls({
  playerCombatant,
  onMoveSelect,
  onSwapInitiate, // Destructure new prop
  canSwap,        // Destructure new prop
  disabled = false
}: PlayerControlsProps) {
  return (
    <div className="player-controls" style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      {playerCombatant.moves.map((moveId) => (
        <button
          key={moveId}
          onClick={() => onMoveSelect(moveId)}
          disabled={disabled} // Use the disabled prop
          aria-label={`Use move ${moves[moveId]?.name ?? 'Unknown'}`}
        >
          {moves[moveId]?.name ?? 'Unknown Move'} {/* Safer access */}
        </button>
      ))}
      {/* --- NEW SWAP BUTTON --- */}
      {canSwap && ( // Only show swap if possible (e.g., benched creatures available)
        <button
          onClick={onSwapInitiate}
          disabled={disabled}
          style={{ background: '#6b7280' }} // Different color for swap
          aria-label="Swap active creature"
        >
          Swap
        </button>
      )}
      {/* Add Item buttons here later */}
    </div>
  );
}