// src/components/battle/CombatantDisplay.tsx
import React, { useMemo, useState } from 'react';
import { Combatant } from '../../battle/engine';
import { HPBar } from './HPBar';
import { SpeciesId, species } from '../../data/species';
import { getSpriteForSpecies } from '../../utils/spriteMapping';
import { useCrowdSprite } from '../../hooks/useCrowdSprite';
import { SpriteCurationPanel } from '../SpriteCurationPanel';

interface CombatantDisplayProps {
  combatant: Combatant & { speciesId: SpeciesId; maxHp: number };
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
  const hpText = `${combatant.stats.hp}/${combatant.maxHp} HP`;

  return (
    <div className={`combatant-display ${isPlayer ? 'player' : 'enemy'} ${isActive ? 'active' : ''}`}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={spriteSrc} className="sprite" alt={combatant.name} />
        <button
          style={{ position: 'absolute', right: 0, bottom: 0, fontSize: 10, padding: '2px 6px' }}
          onClick={() => setShowCuration(true)}
        >
          Sprites
        </button>
      </div>
      <div style={{ fontWeight: 700 }}>{combatant.name}</div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{(species[combatant.speciesId]?.type) || ''}</div>
      <HPBar currentHp={combatant.stats.hp} maxHp={combatant.maxHp} />
      <div style={{ fontSize: 12, opacity: 0.8 }}>{hpText}</div>

      {showCuration && scientificName && (
        <SpriteCurationPanel scientificName={scientificName} onClose={() => setShowCuration(false)} />
      )}
    </div>
  );
}