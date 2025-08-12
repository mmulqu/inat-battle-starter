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

  const spriteSrc = getSpriteForSpecies(combatant.speciesId);
  const hpText = `${combatant.stats.hp}/${combatant.maxHp} HP`;

  return (
    <div className={`combatant-display ${isPlayer ? 'player' : 'enemy'} ${isActive ? 'active' : ''}`} style={{ display: 'inline-block' }}>
      <img src={spriteSrc} className="sprite" alt={combatant.name} />
      <div style={{ fontWeight: 700 }}>{combatant.name}</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{combatant.type}</div>
      <HPBar currentHp={combatant.stats.hp} maxHp={combatant.maxHp} />
      <div style={{ fontSize: 12, opacity: 0.8 }}>{hpText}</div>
    </div>
  );
}