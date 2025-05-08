// src/components/BattleScene.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { moves, MoveId } from '../data/moves';
import { takeTurn, Combatant, TurnResult, LogMessage, LogCategory } from '../battle/engine';
import { SpeciesId } from '../data/species';

import { CombatantDisplay } from './battle/CombatantDisplay';
import { PlayerControls } from './battle/PlayerControls';
import { BattleLog, FormattedLogEntry } from './battle/BattleLog';

const ATTACK_ANIMATION_DURATION = 600; // Duration in milliseconds for the attack animation

type FullCombatant = Combatant & { maxHp: number; speciesId: SpeciesId; isFainted: boolean };

interface BattleSceneProps {
    player1Name: string;
    player2Name: string;
    initialPlayerTeam: FullCombatant[];
    initialEnemyTeam: FullCombatant[];
    onBattleEnd: (winnerName?: string) => void;
}

let logCounter = 0; // Simple unique ID generator for logs

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
    const [log, setLog] = useState<FormattedLogEntry[]>(() => [
        { id: `log-${logCounter++}`, text: 'Battle Start!', styleType: 'system' }
    ]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [battleMessage, setBattleMessage] = useState<string>("");
    const [showPlayerSwitchPrompt, setShowPlayerSwitchPrompt] = useState(false);
    const [controlsLocked, setControlsLocked] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);
    const [attackingCombatantId, setAttackingCombatantId] = useState<string | null>(null);

    const activePlayer = useMemo(() => playerTeam[activePlayerIndex], [playerTeam, activePlayerIndex]);
    const activeEnemy = useMemo(() => enemyTeam[activeEnemyIndex], [enemyTeam, activeEnemyIndex]);

    useEffect(() => {
        console.log("[DEBUG BattleScene INITIAL MOUNT] playerTeam:", playerTeam);
        console.log("[DEBUG BattleScene INITIAL MOUNT] enemyTeam:", enemyTeam);
        playerTeam.forEach((p, i) => console.log(`[DEBUG BattleScene INITIAL MOUNT] playerTeam[${i}].statusConditions:`, p.statusConditions));
        enemyTeam.forEach((e, i) => console.log(`[DEBUG BattleScene INITIAL MOUNT] enemyTeam[${i}].statusConditions:`, e.statusConditions));
    }, []); // Empty dependency array makes this run once on mount

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
            addSystemLog(`${player2Name} wins the match!`, 'system');
            return true;
        }
        if (allEnemyFainted) {
            console.log("[DEBUG] checkBattleEnd: All enemies fainted. Player 1 wins.");
            setControlsLocked(true);
            setBattleMessage(`${player1Name} wins the match!`);
            addSystemLog(`${player1Name} wins the match!`, 'system');
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
        console.log(`[DEBUG processFaint] ${faintedCreature?.name} fainted. Side: ${faintedSide}`);
        addSystemLog(`${faintedCreature?.name || "A creature"} fainted!`, 'system');

        if (!battleMessage && !controlsLocked) { 
            if (faintedSide === 'player') {
                console.log("[DEBUG processFaint] Player creature fainted. Showing switch prompt.");
                setShowPlayerSwitchPrompt(true);
                setControlsLocked(false); // Ensure controls are conceptually available for switching
            } else { // Enemy fainted
                const nextEnemyIdx = findNextAvailableIndex(enemyTeam, (activeEnemyIndex + 1) % enemyTeam.length);
                if (nextEnemyIdx !== -1) {
                    console.log(`[DEBUG processFaint] Enemy fainted. Next enemy index: ${nextEnemyIdx}. Setting new active enemy.`);
                    setActiveEnemyIndex(nextEnemyIdx);
                    addSystemLog(`${player2Name} sends out ${enemyTeam[nextEnemyIdx].name}!`, 'system');
                    console.log("[DEBUG processFaint] Enemy fainted, new enemy selected. Setting isPlayerTurn=false (for new enemy's turn), controlsLocked=false.");
                    setIsPlayerTurn(false); 
                    setControlsLocked(false); 
                } else {
                    console.log("[DEBUG processFaint] All enemies fainted. Game should end.");
                    // checkBattleEndAndUpdateState() called by useEffect should handle this.
                }
            }
        } else {
            console.log("[DEBUG processFaint] Skipped processing: battleMessage or controlsLocked active.", {battleMessage, controlsLocked});
        }
    };

    const handleInitiateSwap = () => {
        if (controlsLocked || battleMessage || !isPlayerTurn || showPlayerSwitchPrompt) return;
        const benchedAvailable = playerTeam.some((c, index) => index !== activePlayerIndex && !c.isFainted);
        if (!benchedAvailable) {
            addSystemLog("No available creatures to swap to!", 'system');
            return;
        }
        setIsSwapping(true);
        addSystemLog(`${player1Name} is choosing who to swap in...`, 'system');
    };

    const handleConfirmSwap = (newIndex: number) => {
        if (controlsLocked || battleMessage || !isPlayerTurn || !isSwapping || playerTeam[newIndex].isFainted || newIndex === activePlayerIndex) {
            setIsSwapping(false);
            return;
        }
        const oldCreatureName = activePlayer.name;
        const newCreatureName = playerTeam[newIndex].name;
        setActivePlayerIndex(newIndex);
        addSystemLog(`${player1Name} withdraws ${oldCreatureName} and sends out ${newCreatureName}!`, 'system');
        setIsSwapping(false);
        if (!checkBattleEndAndUpdateState()) {
            setIsPlayerTurn(false);
        }
    };

    const handleCancelSwap = () => {
        setIsSwapping(false);
        addSystemLog(`${player1Name} decided not to swap.`, 'system');
    };

    function handlePlayerSwitch(newIndex: number) {
        if (controlsLocked || battleMessage || !playerTeam[newIndex] || playerTeam[newIndex].isFainted) return;
        setActivePlayerIndex(newIndex);
        addSystemLog(`${player1Name} sends out ${playerTeam[newIndex].name}!`, 'system');
        setShowPlayerSwitchPrompt(false); 
        if (!battleMessage && !controlsLocked) setIsPlayerTurn(false); 
    }

    function enemyTurn() {
        if (controlsLocked || isPlayerTurn || battleMessage || showPlayerSwitchPrompt || isSwapping || !activeEnemy || activeEnemy.isFainted) {
            return;
        }
        const enemyMoveKey = activeEnemy.moves[Math.floor(Math.random() * activeEnemy.moves.length)];
        if (!enemyMoveKey || !activePlayer) {
            if (!battleMessage && !controlsLocked) setIsPlayerTurn(true); 
            return;
        }

        const enemyCombatantForTurn = JSON.parse(JSON.stringify(activeEnemy));
        const playerCombatantForTurn = JSON.parse(JSON.stringify(activePlayer));

        const turnResult = takeTurn(enemyCombatantForTurn, playerCombatantForTurn, enemyMoveKey);
        appendLogs(formatEngineLogs(turnResult.logs, false)); // false because it's enemy's turn

        let updatedEnemyTeam = enemyTeam.map((c, idx) => 
            idx === activeEnemyIndex ? { ...turnResult.attackerState, isFainted: turnResult.attackerState.stats.hp <= 0 } : c
        );
        let updatedPlayerTeam = playerTeam.map((c, idx) => 
            idx === activePlayerIndex ? { ...turnResult.defenderState, isFainted: turnResult.defenderState.stats.hp <= 0 } : c
        );

        setEnemyTeam(updatedEnemyTeam);
        setPlayerTeam(updatedPlayerTeam);

        const currentAttackerAfterTurn = updatedEnemyTeam[activeEnemyIndex];
        const currentDefenderAfterTurn = updatedPlayerTeam[activePlayerIndex];

        if (turnResult.outcome === "fainted_target" && currentDefenderAfterTurn.isFainted) {
            processFaint('player'); 
        } else if (turnResult.outcome === "self_hit" && currentAttackerAfterTurn.isFainted) {
            processFaint('enemy');
        } else if (turnResult.outcome === "fainted_self" && currentAttackerAfterTurn.isFainted) { // fainted from status before acting or from self-hit
            processFaint('enemy');
        } else {
            if (!checkBattleEndAndUpdateState()) {
                if (!(currentAttackerAfterTurn.isFainted && findNextAvailableIndex(updatedEnemyTeam, activeEnemyIndex) === -1)) {
                     setIsPlayerTurn(true);
                }
            }
        }
    }

    function handleMove(moveKey: MoveId) {
        if (controlsLocked || !isPlayerTurn || battleMessage || showPlayerSwitchPrompt || isSwapping || !activePlayer || activePlayer.isFainted) {
            return;
        }
        if (!activeEnemy) return;

        const playerCombatantForTurn = JSON.parse(JSON.stringify(activePlayer));
        const enemyCombatantForTurn = JSON.parse(JSON.stringify(activeEnemy));

        const turnResult = takeTurn(playerCombatantForTurn, enemyCombatantForTurn, moveKey);
        appendLogs(formatEngineLogs(turnResult.logs, true)); // true because it's player's turn

        let updatedPlayerTeam = playerTeam.map((c, idx) => 
            idx === activePlayerIndex ? { ...turnResult.attackerState, isFainted: turnResult.attackerState.stats.hp <= 0 } : c
        );
        let updatedEnemyTeam = enemyTeam.map((c, idx) => 
            idx === activeEnemyIndex ? { ...turnResult.defenderState, isFainted: turnResult.defenderState.stats.hp <= 0 } : c
        );

        setPlayerTeam(updatedPlayerTeam);
        setEnemyTeam(updatedEnemyTeam);

        const currentAttackerAfterTurn = updatedPlayerTeam[activePlayerIndex];
        const currentDefenderAfterTurn = updatedEnemyTeam[activeEnemyIndex];

        if (turnResult.outcome === "fainted_target" && currentDefenderAfterTurn.isFainted) {
            processFaint('enemy');
        } else if (turnResult.outcome === "self_hit" && currentAttackerAfterTurn.isFainted) {
            processFaint('player'); 
        } else if (turnResult.outcome === "fainted_self" && currentAttackerAfterTurn.isFainted) { // fainted from status before acting or from self-hit
             processFaint('player');
        } else {
            if (!checkBattleEndAndUpdateState()) { 
                 if (!(currentAttackerAfterTurn.isFainted && findNextAvailableIndex(updatedPlayerTeam, activePlayerIndex) === -1)) {
                    setIsPlayerTurn(false);
                 }
            }
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

    // Helper to map engine LogMessage to FormattedLogEntry
    const formatEngineLogs = (engineLogs: LogMessage[], currentTurnIsPlayer: boolean): FormattedLogEntry[] => {
        return engineLogs.map(engineLog => {
            let styleType: FormattedLogEntry['styleType'] = 'neutral';
            const sourceIsPlayer = engineLog.sourceId === activePlayer?.id;
            const sourceIsEnemy = engineLog.sourceId === activeEnemy?.id;
            const targetIsPlayer = engineLog.targetId === activePlayer?.id;
            const targetIsEnemy = engineLog.targetId === activeEnemy?.id;

            switch (engineLog.category) {
                case 'MOVE_USAGE':
                    styleType = sourceIsPlayer ? 'player' : 'enemy';
                    break;
                case 'DAMAGE_DEALT':
                    // If player dealt damage to enemy, style as 'player' (player's successful action)
                    // If enemy dealt damage to player, style as 'enemy' (enemy's successful action)
                    styleType = currentTurnIsPlayer ? 'player' : 'enemy'; 
                    break;
                case 'STAT_CHANGE':
                    styleType = sourceIsPlayer ? 'buff' : (sourceIsEnemy ? 'debuff' : 'neutral'); // Simplified: if source is player, it's a buff for them, if enemy, assume it's a debuff for player or buff for enemy
                    // More granular: check if stat rose or fell for source, then map to buff/debuff.
                    // For now, text like "Pikachu's Attack rose!" is styled based on Pikachu.
                    if (engineLog.text.includes("rose") || engineLog.text.includes("increased")) styleType = 'buff';
                    else if (engineLog.text.includes("fell") || engineLog.text.includes("decreased")) styleType = 'debuff';
                    else styleType = sourceIsPlayer ? 'player' : (sourceIsEnemy ? 'enemy' : 'neutral');
                    break;
                case 'STATUS_APPLIED':
                case 'STATUS_EFFECT':
                    styleType = 'status';
                    break;
                case 'FAINTED':
                    styleType = 'system'; // Fainting is a significant system event
                    break;
                case 'ACCURACY_MISS':
                case 'NO_EFFECT':
                case 'EFFECTIVENESS': // Could be player (super effective for player) or enemy (super effective for enemy)
                     // For effectiveness, let's make it 'player' if good for player, 'enemy' if good for enemy
                    if (engineLog.text.includes("super effective")) {
                        styleType = currentTurnIsPlayer ? 'player' : 'enemy';
                    } else if (engineLog.text.includes("not very effective") || engineLog.text.includes("doesn't affect")) {
                        styleType = currentTurnIsPlayer ? 'enemy' : 'player'; // Bad for current attacker
                    } else {
                        styleType = 'neutral';
                    }
                    break;
                default:
                    styleType = 'neutral';
            }

            return { id: `log-${logCounter++}`, text: engineLog.text, styleType };
        });
    };

    const appendLogs = (newLogs: FormattedLogEntry[]) => {
        setLog(prev => [...prev, ...newLogs]);
    };
    
    const addSystemLog = (text: string, type: FormattedLogEntry['styleType'] = 'system') => {
        appendLogs([{ id: `log-${logCounter++}`, text, styleType: type }]);
    }

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
            {/* Team Info Header - Stays above columns */}
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '0 10px', fontWeight: 'bold' }}>
                <span>{player1Name} (Team: {playerTeam.filter(c=>!c.isFainted).length}/{playerTeam.length})</span>
                <span>{player2Name} (Team: {enemyTeam.filter(c=>!c.isFainted).length}/{enemyTeam.length})</span>
            </div>

            {/* Main Battle Area - Flex Container */}
            <div className="battle-main-area">

                {/* Left Column */}
                <div className="battle-left-column">
                    {activeEnemy && (
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <CombatantDisplay 
                                combatant={activeEnemy} 
                                isActive={!isPlayerTurn && !showPlayerSwitchPrompt && !controlsLocked && !isSwapping && !battleMessage} 
                                actionState={activeEnemy.id === attackingCombatantId ? 'attacking' : 'idle'}
                            />
                        </div>
                    )}
                    <hr style={{ margin: '16px 0', opacity: 0.4 }} />
                    {activePlayer && (
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <CombatantDisplay 
                                combatant={activePlayer} 
                                isPlayer={true} 
                                isActive={isPlayerTurn && !showPlayerSwitchPrompt && !controlsLocked && !isSwapping && !battleMessage} 
                                actionState={activePlayer.id === attackingCombatantId ? 'attacking' : 'idle'} 
                            />
                        </div>
                    )}

                    {/* Conditional UIs - Now correctly placed */}
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
                </div>

                {/* Right Column */}
                <div className="battle-right-column">
                    <BattleLog entries={log} />
                </div>

            </div> {/* End battle-main-area */}     
        </div>
    );
}