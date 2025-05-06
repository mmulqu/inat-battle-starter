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
        <div className="selection-screen" style={{ padding: '20px', background: '#2d3248', borderRadius: '8px', color: '#f8f8f8', maxWidth: '700px', margin: 'auto' }}>
            <h2>{playerName}, Assemble Your Team!</h2>
            <p>Select {TEAM_SIZE} creatures.</p>
            <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Selected: {selectedIds.length} / {TEAM_SIZE}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
                {speciesList.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => handleSelectSpecies(s.id as SpeciesId)}
                        style={{
                            background: isSelected(s.id as SpeciesId) ? '#3ad87b' : '#4a5170', // Highlight selected
                            border: isSelected(s.id as SpeciesId) ? '2px solid white' : '2px solid transparent',
                            borderRadius: '8px',
                            padding: '15px',
                            color: '#f8f8f8',
                            cursor: 'pointer',
                            textAlign: 'center',
                            minWidth: '130px',
                            boxShadow: '0 2px 5px rgba(0,0,0,.3)',
                            transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                            opacity: selectedIds.length === TEAM_SIZE && !isSelected(s.id as SpeciesId) ? 0.5 : 1, // Dim if team full and not selected
                        }}
                        onMouseOver={(e) => { if (selectedIds.length < TEAM_SIZE || isSelected(s.id as SpeciesId)) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,.4)'; }}}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,.3)'; }}
                        disabled={selectedIds.length === TEAM_SIZE && !isSelected(s.id as SpeciesId)} // Disable if team full and not selected
                    >
                        <img
                            // --- NEW: Use the utility function ---
                            src={getSpriteForSpecies(s.id as SpeciesId)}
                            alt={s.name}
                            style={{ width: '64px', height: '64px', imageRendering: 'pixelated', display: 'block', margin: '0 auto 10px auto' }}
                        />
                        <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                    </button>
                ))}
            </div>

            {canConfirm && (
                <button
                    onClick={() => onTeamConfirm(selectedIds)}
                    style={{ display: 'block', margin: '20px auto', padding: '10px 20px', fontSize: '1.2em', background: '#3ad87b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Start Battle!
                </button>
            )}
        </div>
    );
}