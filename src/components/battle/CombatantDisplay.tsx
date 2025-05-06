// src/components/battle/CombatantDisplay.tsx
import React from 'react';
import { Combatant } from '../../battle/engine';
import { HPBar } from './HPBar';
import { SpeciesId } from '../../data/species'; // Import SpeciesId
import { getSpriteForSpecies } from '../../utils/spriteMapping'; // Import the utility

interface CombatantDisplayProps {
  combatant: Combatant & { speciesId: SpeciesId; maxHp: number }; // Ensure speciesId and maxHp
  isActive?: boolean;
  isPlayer?: boolean;
}

export function CombatantDisplay({
  combatant,
  isActive = false,
  isPlayer = false
}: CombatantDisplayProps) {

  // Use the utility function to get the correct sprite
  const spriteSrc = getSpriteForSpecies(combatant.speciesId);

  return (
    <div className={`combatant-display ${isPlayer ? 'player' : 'enemy'} ${isActive ? 'active' : ''}`}>
      <img src={spriteSrc} className="sprite" alt={combatant.name} />
      <div>
        {combatant.name} (HP: {combatant.stats.hp})
        {/* Display Status Conditions Icons */}
        <span className="status-conditions-container">
          {combatant.statusConditions && combatant.statusConditions.map(status => (
            <span key={status.type} title={`${status.type}${status.duration ? ` (${status.duration})` : ''}`} className={`status-icon status-${status.type.toLowerCase()}`}>
              {status.type.charAt(0).toUpperCase()}
            </span>
          ))}
        </span>
      </div>
      {/* Pass maxHp from the combatant object */}
      <HPBar currentHp={combatant.stats.hp} maxHp={combatant.maxHp} />
    </div>
  );
}