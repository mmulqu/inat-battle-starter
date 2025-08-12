// src/components/battle/CombatantDisplay.tsx
import React, { useMemo, useState } from 'react';
import { Combatant } from '../../battle/engine';
import { HPBar } from './HPBar';
import { SpeciesId, species } from '../../data/species'; // Import SpeciesId and species map
import { getSpriteForSpecies } from '../../utils/spriteMapping'; // Fallback utility
import { useCrowdSprite } from '../../hooks/useCrowdSprite';
import { SpriteCurationPanel } from '../SpriteCurationPanel';

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
  const fallbackSrc = getSpriteForSpecies(combatant.speciesId);

  const scientificName = useMemo(() => {
    const entry = species[combatant.speciesId];
    return (entry as any)?.scientificName || entry?.name || combatant.name;
  }, [combatant.speciesId, combatant.name]);

  const crowdUrl = useCrowdSprite(scientificName);
  const [showCuration, setShowCuration] = useState(false);

  const spriteSrc = crowdUrl || fallbackSrc;

  return (
    <div className={`combatant-display ${isPlayer ? 'player' : 'enemy'} ${isActive ? 'active' : ''}`}>
      <div style={{ position: 'relative' }}>
        <img src={spriteSrc} className="sprite" alt={combatant.name} />
        <button style={{ position: 'absolute', right: 0, bottom: 0, fontSize: 10, padding: '2px 6px' }} onClick={() => setShowCuration(true)}>Sprites</button>
      </div>
      <div>{combatant.name} (HP: {combatant.stats.hp})</div>
      <HPBar currentHp={combatant.stats.hp} maxHp={combatant.maxHp} />

      {showCuration && scientificName && (
        <SpriteCurationPanel scientificName={scientificName} onClose={() => setShowCuration(false)} />
      )}
    </div>
  );
}