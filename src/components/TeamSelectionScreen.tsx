// src/components/TeamSelectionScreen.tsx
import React, { useState } from 'react';
import { SpeciesData, SpeciesId } from '../data/species';

// --- NEW: Import the utility function ---
import { getSpriteForSpecies } from '../utils/spriteMapping';
// --- Remove individual sprite imports and the local spriteMap ---

const TEAM_SIZE = 3;

interface TeamSelectionScreenProps {
    availableSpecies: Record<SpeciesId, SpeciesData>;
    onTeamConfirm: (selectedTeamIds: SpeciesId[]) => void;
    playerName: string;
}

export function TeamSelectionScreen({ availableSpecies, onTeamConfirm, playerName }: TeamSelectionScreenProps) {
    const [selectedIds, setSelectedIds] = useState<SpeciesId[]>([]);
    const speciesList = Object.values(availableSpecies);

    const handleSelectSpecies = (id: SpeciesId) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(speciesId => speciesId !== id));
        } else if (selectedIds.length < TEAM_SIZE) {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const isSelected = (id: SpeciesId) => selectedIds.includes(id);
    const canConfirm = selectedIds.length === TEAM_SIZE;

    return (
        <div className="selection-screen" style={{ padding: '24px', background: '#1b2036', border: '1px solid #2a2f47', borderRadius: '12px', color: '#f8f8f8', maxWidth: '840px', margin: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.45)' }}>
            <h2 style={{ marginTop: 0 }}>{playerName}, assemble your team</h2>
            <p>Select {TEAM_SIZE} creatures.</p>
            <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Selected: {selectedIds.length} / {TEAM_SIZE}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
                {speciesList.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => handleSelectSpecies(s.id as SpeciesId)}
                        aria-pressed={isSelected(s.id as SpeciesId)}
                        aria-label={`Select ${s.name}`}
                        style={{
                            background: isSelected(s.id as SpeciesId) ? '#22c55e' : '#111425',
                            color: '#e5e7eb',
                            border: isSelected(s.id as SpeciesId) ? '2px solid #d1fae5' : '2px solid #2a2f47',
                            borderRadius: '10px',
                            padding: '14px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            minWidth: '160px',
                            boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                            transition: 'transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease, background-color 0.12s ease, border-color 0.12s ease',
                            opacity: selectedIds.length === TEAM_SIZE && !isSelected(s.id as SpeciesId) ? 0.55 : 1,
                        }}
                        onMouseOver={(e) => { if (selectedIds.length < TEAM_SIZE || isSelected(s.id as SpeciesId)) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.4)'; }}}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)'; }}
                        disabled={selectedIds.length === TEAM_SIZE && !isSelected(s.id as SpeciesId)}
                    >
                        <img
                            // --- NEW: Use the utility function ---
                            src={getSpriteForSpecies(s.id as SpeciesId)}
                            alt={s.name}
                            style={{ width: '72px', height: '72px', imageRendering: 'pixelated', display: 'block', margin: '0 auto 10px auto' }}
                        />
                        <span style={{ fontWeight: 700 }}>{s.name}</span>
                    </button>
                ))}
            </div>

            <button
                onClick={() => onTeamConfirm(selectedIds)}
                style={{ display: 'block', margin: '20px auto 4px', padding: '12px 20px', fontSize: '1.05em', background: canConfirm ? '#22c55e' : '#6b7280', color: 'white', border: 'none', borderRadius: '10px', cursor: canConfirm ? 'pointer' : 'not-allowed' }}
                disabled={!canConfirm}
            >
                Start Battle
            </button>
        </div>
    );
}