// src/components/BattleScene.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { moves, MoveId } from '../data/moves';
import { takeTurn, Combatant } from '../battle/engine';
import { SpeciesId } from '../data/species';

import { CombatantDisplay } from './battle/CombatantDisplay';
import { PlayerControls } from './battle/PlayerControls';
import { BattleLog } from './battle/BattleLog';

type FullCombatant = Combatant & { maxHp: number; speciesId: SpeciesId; isFainted: boolean };

interface BattleSceneProps {
    player1Name: string;
    player2Name: string;
    initialPlayerTeam: FullCombatant[];
    initialEnemyTeam: FullCombatant[];
    onBattleEnd: (winnerName?: string) => void;
}

export function BattleScene({
    player1Name,
    player2Name,
    initialPlayerTeam,
    initialEnemyTeam,
    onBattleEnd
}: BattleSceneProps) {
    const [playerTeam, setPlayerTeam] = useState<FullCombatant[]>(() => JSON.parse(JSON.stringify(initialPlayerTeam)));
    const [enemyTeam, setEnemyTeam] = useState<FullCombatant[]>(() => JSON.parse(JSON.stringify(initialEnemyTeam)));
    const [activePlayerIndex, setActivePlayerIndex] = useState(0);
    const [activeEnemyIndex, setActiveEnemyIndex] = useState(0);
    const [log, setLog] = useState<string[]>(['Battle Start!']);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [battleMessage, setBattleMessage] = useState<string>("");
    const [showPlayerSwitchPrompt, setShowPlayerSwitchPrompt] = useState(false);
    const [controlsLocked, setControlsLocked] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);

    const activePlayer = useMemo(() => playerTeam[activePlayerIndex], [playerTeam, activePlayerIndex]);
    const activeEnemy = useMemo(() => enemyTeam[activeEnemyIndex], [enemyTeam, activeEnemyIndex]);

    const findNextAvailableIndex = (team: FullCombatant[], startIndex: number = 0): number => {
        for (let i = 0; i < team.length; i++) {
            const checkIndex = (startIndex + i) % team.length;
            if (team[checkIndex] && !team[checkIndex].isFainted) return checkIndex;
        }
        return -1;
    };

    // useEffect to handle the transition to GameOverScreen once battleMessage is set
    useEffect(() => {
        if (battleMessage) {
            console.log(`[DEBUG] useEffect (battleMessage): Battle message "${battleMessage}" detected. Scheduling onBattleEnd.`);
            const timerId = setTimeout(() => {
                if (battleMessage.includes(player1Name)) onBattleEnd(player1Name);
                else if (battleMessage.includes(player2Name)) onBattleEnd(player2Name);
                else onBattleEnd();
            }, 3000);
            return () => clearTimeout(timerId);
        }
    }, [battleMessage, onBattleEnd, player1Name, player2Name]);

    const checkBattleEndAndUpdateState = () => {
        if (battleMessage || controlsLocked) return true; 

        const allPlayerFainted = playerTeam.every(c => c.isFainted);
        const allEnemyFainted = enemyTeam.every(c => c.isFainted);

        if (allPlayerFainted) {
            console.log("[DEBUG] checkBattleEnd: All players fainted. CPU wins.");
            setControlsLocked(true);
            setBattleMessage(`${player2Name} wins the match!`);
            setLog(prev => [...prev, `${player2Name} wins the match!`]);
            return true;
        }
        if (allEnemyFainted) {
            console.log("[DEBUG] checkBattleEnd: All enemies fainted. Player 1 wins.");
            setControlsLocked(true);
            setBattleMessage(`${player1Name} wins the match!`);
            setLog(prev => [...prev, `${player1Name} wins the match!`]);
            return true;
        }
        return false;
    };

    // NEW useEffect to check for game end after team states update
    useEffect(() => {
        if (!battleMessage && !controlsLocked) {
            // This runs after playerTeam or enemyTeam state updates.
            // checkBattleEndAndUpdateState will read the latest state.
            console.log("[DEBUG] useEffect (team/status change): Checking for battle end.");
            checkBattleEndAndUpdateState();
        }
    }, [playerTeam, enemyTeam, battleMessage, controlsLocked]); // Removed checkBattleEndAndUpdateState from deps as it causes issues if not memoized

    const processFaint = (faintedSide: 'player' | 'enemy') => {
        const faintedCreature = faintedSide === 'player' ? activePlayer : activeEnemy;
        setLog(prev => [...prev, `${faintedCreature?.name || "A creature"} fainted!`]);

        // Game end is now primarily handled by the useEffect above.
        // This function handles immediate consequences if the game hasn't ended.

        if (!battleMessage && !controlsLocked) { // Check if game hasn't already been marked as ended
            if (faintedSide === 'player') {
                setShowPlayerSwitchPrompt(true);
            } else { // Enemy fainted
                const nextEnemyIdx = findNextAvailableIndex(enemyTeam, (activeEnemyIndex + 1) % enemyTeam.length);
                if (nextEnemyIdx !== -1) {
                    setActiveEnemyIndex(nextEnemyIdx);
                    setLog(prev => [...prev, `${player2Name} sends out ${enemyTeam[nextEnemyIdx].name}!`]);
                    setIsPlayerTurn(true); 
                } else {
                    // If no next enemy, the useEffect checking team states should catch this for game end.
                    console.log("[DEBUG] processFaint (enemy): No next enemy. Game end should be handled by useEffect.");
                }
            }
        }
    };

    const handleInitiateSwap = () => {
        if (controlsLocked || battleMessage || !isPlayerTurn || showPlayerSwitchPrompt) return;
        const benchedAvailable = playerTeam.some((c, index) => index !== activePlayerIndex && !c.isFainted);
        if (!benchedAvailable) {
            setLog(prev => [...prev, "No available creatures to swap to!"]);
            return;
        }
        setIsSwapping(true);
        setLog(prev => [...prev, `${player1Name} is choosing who to swap in...`]);
    };

    const handleConfirmSwap = (newIndex: number) => {
        if (controlsLocked || battleMessage || !isPlayerTurn || !isSwapping || playerTeam[newIndex].isFainted || newIndex === activePlayerIndex) {
            setIsSwapping(false);
            return;
        }
        const oldCreatureName = activePlayer.name;
        const newCreatureName = playerTeam[newIndex].name;
        setActivePlayerIndex(newIndex);
        setLog(prev => [...prev, `${player1Name} withdraws ${oldCreatureName} and sends out ${newCreatureName}!`]);
        setIsSwapping(false);
        setIsPlayerTurn(false);
    };

    const handleCancelSwap = () => {
        setIsSwapping(false);
        setLog(prev => [...prev, `${player1Name} decided not to swap.`]);
    };

    function handlePlayerSwitch(newIndex: number) {
        if (controlsLocked || battleMessage || !playerTeam[newIndex] || playerTeam[newIndex].isFainted) return;
        setActivePlayerIndex(newIndex);
        setLog(prev => [...prev, `${player1Name} sends out ${playerTeam[newIndex].name}!`]);
        setShowPlayerSwitchPrompt(false); 
        if (!battleMessage && !controlsLocked) setIsPlayerTurn(false); 
    }

    function enemyTurn() {
        if (controlsLocked || isPlayerTurn || battleMessage || showPlayerSwitchPrompt || isSwapping || !activeEnemy || activeEnemy.isFainted) {
            return;
        }
        console.log(`[DEBUG] enemyTurn attacking ${activePlayer?.name}`);
        const enemyMoveKey = activeEnemy.moves[Math.floor(Math.random() * activeEnemy.moves.length)];
        if (!enemyMoveKey || !activePlayer) {
            if (!battleMessage && !controlsLocked) setIsPlayerTurn(true); return;
        }

        const turnResult = takeTurn(activeEnemy, activePlayer, enemyMoveKey);
        let newPlayerTeam = playerTeam.map((c, idx) =>
            idx === activePlayerIndex ? { ...c, stats: { ...c.stats, hp: turnResult.defenderHp } } : c
        );
        setLog(prev => [...prev, turnResult.log]);

        if (newPlayerTeam[activePlayerIndex].stats.hp <= 0) {
            newPlayerTeam = newPlayerTeam.map((c, idx) =>
                idx === activePlayerIndex ? { ...c, isFainted: true, stats: { ...c.stats, hp: 0 } } : c
            );
            setPlayerTeam(newPlayerTeam);
            processFaint('player'); 
        } else {
            setPlayerTeam(newPlayerTeam);
            if (!battleMessage && !controlsLocked) setIsPlayerTurn(true);
        }
    }

    function handleMove(moveKey: MoveId) {
        if (controlsLocked || !isPlayerTurn || battleMessage || showPlayerSwitchPrompt || isSwapping || !activePlayer || activePlayer.isFainted) {
            return;
        }
        console.log(`[DEBUG] handleMove: ${activePlayer.name} attacking ${activeEnemy?.name}`);
        if (!activeEnemy) return;

        const turnResult = takeTurn(activePlayer, activeEnemy, moveKey);
        let newEnemyTeam = enemyTeam.map((c, idx) =>
            idx === activeEnemyIndex ? { ...c, stats: { ...c.stats, hp: turnResult.defenderHp } } : c
        );
        setLog(prev => [...prev, turnResult.log]);

        if (newEnemyTeam[activeEnemyIndex].stats.hp <= 0) {
            newEnemyTeam = newEnemyTeam.map((c, idx) =>
                idx === activeEnemyIndex ? { ...c, isFainted: true, stats: { ...c.stats, hp: 0 } } : c
            );
            setEnemyTeam(newEnemyTeam);
            processFaint('enemy'); 
        } else {
            setEnemyTeam(newEnemyTeam);
            if (!battleMessage && !controlsLocked) setIsPlayerTurn(false);
        }
    }
    
    // useEffect for triggering enemy turn (kept from previous user update)
    useEffect(() => {
        if (!controlsLocked && !isPlayerTurn && !battleMessage && !showPlayerSwitchPrompt && !isSwapping && activeEnemy && !activeEnemy.isFainted) {
            const timerId = setTimeout(() => {
                if (!controlsLocked && !isPlayerTurn && !battleMessage && !showPlayerSwitchPrompt && !isSwapping && activeEnemy && !activeEnemy.isFainted) {
                    enemyTurn();
                }
            }, 150); 
            return () => clearTimeout(timerId);
        }
    }, [controlsLocked, isPlayerTurn, battleMessage, showPlayerSwitchPrompt, isSwapping, activeEnemy, playerTeam, enemyTeam]);

    // JSX / Render logic (kept from previous user update)
    if (battleMessage) { 
        return ( <div className="battle-wrapper" style={{ textAlign: 'center', padding: '20px' }}> <h1>{battleMessage}</h1> </div> );
    }
    if (!activePlayer || !activeEnemy) { 
        return <div className="battle-wrapper"><p>Loading battle...</p></div>;
    }

    const canPlayerSwap = playerTeam.some((c, index) => index !== activePlayerIndex && !c.isFainted) && !showPlayerSwitchPrompt && !isSwapping;

    return (
        <div className="battle-wrapper">
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '0 10px', fontWeight: 'bold' }}>
                <span>{player1Name} (Team: {playerTeam.filter(c=>!c.isFainted).length}/{playerTeam.length})</span>
                <span>{player2Name} (Team: {enemyTeam.filter(c=>!c.isFainted).length}/{enemyTeam.length})</span>
            </div>

            {activeEnemy && (
                <div style={{ textAlign: 'center', marginBottom: '16px', opacity: (isPlayerTurn || showPlayerSwitchPrompt || controlsLocked || isSwapping || battleMessage) ? 0.7 : 1.0 }}>
                    <CombatantDisplay combatant={activeEnemy} isActive={!isPlayerTurn && !showPlayerSwitchPrompt && !controlsLocked && !isSwapping && !battleMessage} />
                </div>
            )}
            <hr style={{ margin: '16px 0', opacity: 0.4 }} />
            {activePlayer && (
                <div style={{ textAlign: 'center', marginTop: '16px', opacity: (!isPlayerTurn || showPlayerSwitchPrompt || controlsLocked || isSwapping || battleMessage) ? 0.7 : 1.0 }}>
                <CombatantDisplay combatant={activePlayer} isPlayer={true} isActive={isPlayerTurn && !showPlayerSwitchPrompt && !controlsLocked && !isSwapping && !battleMessage} />
                </div>
            )}

            {isSwapping && !controlsLocked && !battleMessage && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#4a5170', borderRadius: '5px', textAlign: 'center' }}>
                    <p>Choose a creature to swap in:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {playerTeam.map((member, index) => (
                            index !== activePlayerIndex && !member.isFainted && (
                                <button
                                    key={member.id}
                                    onClick={() => handleConfirmSwap(index)}
                                    style={{ padding: '8px 12px', background: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px'}}
                                >
                                    {member.name} (HP: {member.stats.hp}/{member.maxHp})
                                </button>
                            )
                        ))}
                    </div>
                    <button onClick={handleCancelSwap} style={{ padding: '8px 12px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px'}}>
                        Cancel Swap
                    </button>
                </div>
            )}

            {showPlayerSwitchPrompt && !isSwapping && !battleMessage && !controlsLocked && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#4a5170', borderRadius: '5px', textAlign: 'center' }}>
                    <p>{activePlayer?.name || 'Your creature'} fainted! Choose your next creature:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {playerTeam.map((member, index) => (
                            !member.isFainted && (
                                <button key={member.id} onClick={() => handlePlayerSwitch(index)}
                                    style={{ padding: '8px 12px', background: '#3ad87b', color: 'white', border: 'none', borderRadius: '4px'}}>
                                    {member.name} (HP: {member.stats.hp}/{member.maxHp})
                                </button>
                            )
                        ))}
                    </div>
                </div>
            )}

            {!controlsLocked && !battleMessage && !showPlayerSwitchPrompt && !isSwapping && activePlayer && !activePlayer.isFainted && (
                <PlayerControls
                    playerCombatant={activePlayer}
                    onMoveSelect={handleMove}
                    onSwapInitiate={handleInitiateSwap} 
                    canSwap={canPlayerSwap}              
                    disabled={!isPlayerTurn || controlsLocked}
                />
            )}

            {battleMessage && !controlsLocked && ( 
                <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', background: '#1f2333', borderRadius: '5px', fontWeight: 'bold', fontSize: '1.2em' }}>
                    {battleMessage}
                </div>
            )}
            <BattleLog entries={log} />
        </div>
    );
}