// src/App.tsx
import React, { useState } from 'react';
import { species, SpeciesData, SpeciesId } from './data/species';
import { TeamSelectionScreen } from './components/TeamSelectionScreen';
import { BattleScene } from './components/BattleScene';
import { GameOverScreen } from './components/GameOverScreen'; // Import the new component
import { Combatant } from './battle/engine';

const TEAM_SIZE = 3; // Consistent team size

// Helper to create Combatant structure from SpeciesData
// Ensure speciesId is added here for CombatantDisplay
const createCombatantFromSpecies = (
    speciesData: SpeciesData,
    ownerName: string, // To differentiate IDs if same species used multiple times
    originalSpeciesId: SpeciesId // Pass the original SpeciesId
): Combatant & { maxHp: number; speciesId: SpeciesId; isFainted: boolean } => {
    const initialStats = JSON.parse(JSON.stringify(speciesData.stats));
    return {
        id: `${ownerName}-${speciesData.id}-${Math.random().toString(36).substring(7)}`, // More unique ID
        name: speciesData.name,
        type: speciesData.type,
        stats: initialStats,
        moves: [...speciesData.moves],
        maxHp: initialStats.hp,
        speciesId: originalSpeciesId, // Store the original species ID for sprite mapping
        isFainted: false, // Add fainted status
    };
};

// Add 'gameOver' to GameView
type GameView = 'teamSelection' | 'battle' | 'gameOver';

export function App() {
    const [view, setView] = useState<GameView>('teamSelection');
    // Store arrays of combatants for teams
    const [playerTeam, setPlayerTeam] = useState<(Combatant & { maxHp: number; speciesId: SpeciesId; isFainted: boolean })[]>([]);
    const [enemyTeam, setEnemyTeam] = useState<(Combatant & { maxHp: number; speciesId: SpeciesId; isFainted: boolean })[]>([]);
    const [winner, setWinner] = useState<string | undefined>(undefined); // State to store the winner's name

    const player1Name = "Player 1";
    const player2Name = "CPU";

    const handleTeamConfirmed = (selectedPlayerSpeciesIds: SpeciesId[]) => {
        // Create the player's full team
        const newPlayerTeam = selectedPlayerSpeciesIds.map(id =>
            createCombatantFromSpecies(species[id], player1Name, id)
        );
        setPlayerTeam(newPlayerTeam);

        // --- Create a random enemy team ---
        // Make a mutable copy of all species IDs to pick from
        let availableEnemyPoolIds = Object.keys(species) as SpeciesId[];
        const enemySelectedSpeciesIds: SpeciesId[] = [];

        for (let i = 0; i < TEAM_SIZE; i++) {
            if (availableEnemyPoolIds.length === 0) {
                // If we run out of unique species (e.g., TEAM_SIZE > total species)
                // just pick randomly from all species again for the remaining slots
                availableEnemyPoolIds = Object.keys(species) as SpeciesId[];
                if (availableEnemyPoolIds.length === 0) break; // Should not happen if species exist
            }
            const randomIndex = Math.floor(Math.random() * availableEnemyPoolIds.length);
            const randomId = availableEnemyPoolIds.splice(randomIndex, 1)[0]; // Pick and remove
            enemySelectedSpeciesIds.push(randomId);
        }
        
        const newEnemyTeam = enemySelectedSpeciesIds.map(id =>
            createCombatantFromSpecies(species[id], player2Name, id)
        );
        setEnemyTeam(newEnemyTeam);
        setWinner(undefined); // Clear any previous winner
        setView('battle');
    };

    // Modified to set winner and change view
    const handleBattleEnd = (winnerName?: string) => {
        console.log(winnerName ? `${winnerName} wins the match!` : "Battle ended (no specific winner).");
        setWinner(winnerName);
        setView('gameOver');
        // Player/Enemy teams are NOT reset here immediately;
        // GameOverScreen will offer "Play Again" which triggers handlePlayAgain.
        // This allows GameOverScreen to potentially display team summaries later.
    };

    // New function to handle playing again
    const handlePlayAgain = () => {
        setPlayerTeam([]); // Clear teams
        setEnemyTeam([]);
        setWinner(undefined); // Clear winner
        setView('teamSelection'); // Go back to team selection
    };

    return (
        // Added some basic styling to center content for better presentation
        <div 
            className="app-container" 
            style={{
                minHeight: '100vh', 
                display: 'flex', 
                flexDirection: 'column', // Allow header/footer later if needed
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '20px' // Add some padding around the content
            }}
        >
            {view === 'teamSelection' && (
                <TeamSelectionScreen
                    availableSpecies={species}
                    onTeamConfirm={handleTeamConfirmed}
                    playerName={player1Name}
                />
            )}

            {view === 'battle' && playerTeam.length > 0 && enemyTeam.length > 0 && (
                 <BattleScene
                    player1Name={player1Name}
                    player2Name={player2Name}
                    initialPlayerTeam={playerTeam}
                    initialEnemyTeam={enemyTeam}
                    onBattleEnd={handleBattleEnd}
                 />
            )}

            {/* Render GameOverScreen */}
            {view === 'gameOver' && (
                <GameOverScreen
                    winnerName={winner}
                    onPlayAgain={handlePlayAgain}
                    // You could pass playerTeam and enemyTeam here later for summaries
                    // finalPlayerTeam={playerTeam} 
                    // finalEnemyTeam={enemyTeam}
                />
            )}
        </div>
    );
}