import { moves, MoveData, ApplyStatusEffect, StatusCondition, ActiveStatusCondition, MoveId } from "../data/moves";
import { SpeciesId } from "../data/species";

// Accuracy and Evasion Constants
const DEFAULT_MOVE_ACCURACY = 0.95; // Default accuracy if move doesn't specify one (e.g., 95%)
const BLINDNESS_ACCURACY_MULTIPLIER = 0.5; // Blindness reduces accuracy by 50%
const SPEED_SCALING_DIVISOR = 10;    // For every X points of speed difference
const DODGE_PERCENT_PER_SCALING_GROUP = 0.05; // Y% increased dodge chance
const MAX_SPEED_DODGE_BONUS = 0.30;  // Max dodge chance bonus from speed alone (e.g., 30%)
const MIN_HIT_CHANCE = 0.10;         // Minimum hit chance (e.g., 10%)
const MAX_HIT_CHANCE = 1.0;          // Maximum possible hit chance (100%)

// NEW Log Message Structure
export type LogCategory = 
  'MOVE_USAGE' |        // "Pikachu used Thunderbolt!"
  'DAMAGE_DEALT' |      // "Thunderbolt dealt 30 damage to Squirtle."
  'EFFECTIVENESS' |     // "It's super effective!"
  'ACCURACY_MISS' |     // "Pikachu's attack missed!"
  'STAT_CHANGE' |       // "Squirtle's Defense rose!" / "Pikachu's Attack fell!"
  'STATUS_APPLIED' |    // "Squirtle was poisoned!"
  'STATUS_EFFECT' |     // "Squirtle is hurt by poison." / "Pikachu is confused!" / "Pikachu hurt itself in confusion!"
  'FAINTED' |           // "Squirtle fainted!"
  'NO_EFFECT';          // "It had no effect."

export interface LogMessage {
  text: string;
  category: LogCategory;
  sourceId?: string; // ID of the combatant primarily responsible for or affected by the log
  targetId?: string; // ID of the combatant targeted, if applicable
}
// END NEW Log Message Structure

export interface Combatant {
  id: string;
  name: string;
  speciesId: SpeciesId;
  stats: { hp: number; atk: number; def: number; spd: number; accuracy: number; evasion: number };
  moves: MoveId[];
  statusConditions: ActiveStatusCondition[];
  maxHp: number; // Ensure maxHp is part of the Combatant type if used by engine
}

export interface TurnResult {
  attackerState: Combatant;
  defenderState: Combatant;
  logs: LogMessage[];
  outcome: 'hit' | 'miss' | 'fainted_target' | 'fainted_self' | 'no_effect' | 'self_hit';
}

export function getEmptyStatusCondition(type: StatusCondition, duration?: number): ActiveStatusCondition {
    return { type, duration: duration || (type === 'poison' || type === 'blindness' ? Infinity : 3) };
}

export function applyStatus(
    target: Combatant,
    statusEffect: ApplyStatusEffect,
    moveName: string, // Optional: Name of the move applying the status for logging
    attackerName?: string // Optional: Name of the attacker for logging
): { logs: LogMessage[], applied: boolean } {
    const logs: LogMessage[] = [];
    let applied = false;
    if (!target.statusConditions.some(sc => sc.type === statusEffect.status)) {
        if (Math.random() < (statusEffect.chance || 1)) {
            const newCondition = getEmptyStatusCondition(statusEffect.status, statusEffect.duration);
            target.statusConditions.push(newCondition);
            logs.push({
                text: `${target.name} was ${statusEffect.status.toLowerCase()}ed!`,
                category: 'STATUS_APPLIED',
                sourceId: attackerName, // If attackerName is provided, it's the source
                targetId: target.id
            });
            applied = true;
        } else {
            logs.push({
                text: `${attackerName ? attackerName + "'s" : "The"} ${moveName} failed to apply ${statusEffect.status.toLowerCase()} to ${target.name}!`,
                category: 'NO_EFFECT', // Or a more specific 'STATUS_RESISTED_CHANCE'
                sourceId: attackerName,
                targetId: target.id
            });
        }
    } else {
        logs.push({
            text: `${target.name} is already ${statusEffect.status.toLowerCase()}!`,
            category: 'NO_EFFECT', // Or 'STATUS_ALREADY_PRESENT'
            targetId: target.id
        });
    }
    return { logs, applied };
}

// Refactored handleStartOfTurnStatuses
function handleStartOfTurnStatuses(combatant: Combatant): {
  updatedCombatant: Combatant;
  logs: LogMessage[];
  continueTurn: boolean;
  selfHitFromConfusion: boolean; // True if combatant hit itself and turn should end thus
} {
  let currentCombatant = JSON.parse(JSON.stringify(combatant));
  const logs: LogMessage[] = [];
  let hpLostThisTurn = 0;
  let canContinue = true;
  let didSelfHitFromConfusion = false;

  currentCombatant.statusConditions = currentCombatant.statusConditions.filter((status: ActiveStatusCondition) => {
    let keepStatus = true;
    if (status.duration !== undefined && status.duration !== Infinity) {
      status.duration -= 1;
      if (status.duration <= 0) {
        logs.push({ text: `${currentCombatant.name} is no longer ${status.type}!`, category: 'STATUS_EFFECT', sourceId: currentCombatant.id });
        keepStatus = false;
      }
    }

    if (keepStatus) {
      switch (status.type) {
        case 'poison':
          const poisonDamage = Math.max(1, Math.floor(currentCombatant.maxHp / 8));
          hpLostThisTurn += poisonDamage;
          logs.push({
            text: `${currentCombatant.name} is hurt by poison! It lost ${poisonDamage} HP.`,
            category: 'STATUS_EFFECT',
            sourceId: currentCombatant.id
          });
          break;
        case 'confusion': // Confusion self-hit chance happens here
          if (Math.random() < 0.33) { // 33% chance to hit self
            const selfDamage = Math.max(1, Math.floor(currentCombatant.stats.atk / 3)); // Example: 1/3rd own Atk
            hpLostThisTurn += selfDamage;
            logs.push({
              text: `${currentCombatant.name} is confused! It hurt itself in its confusion, taking ${selfDamage} damage!`,
              category: 'STATUS_EFFECT',
              sourceId: currentCombatant.id
            });
            canContinue = false; // Cannot continue with regular move if self-hit
            didSelfHitFromConfusion = true;
          } else {
            logs.push({ text: `${currentCombatant.name} is confused, but managed to prepare an attack!`, category: 'STATUS_EFFECT', sourceId: currentCombatant.id });
          }
          break;
        // case 'sleep': 
        //   logs.push({ text: `${currentCombatant.name} is fast asleep!`, category: 'STATUS_EFFECT', sourceId: currentCombatant.id });
        //   canContinue = false; 
        //   break;
        // case 'blindness': // Blindness effect is handled in checkAccuracy
        //   break;
      }
    }
    return keepStatus;
  });

  currentCombatant.stats.hp = Math.max(0, currentCombatant.stats.hp - hpLostThisTurn);
  if (currentCombatant.stats.hp === 0 && hpLostThisTurn > 0 && !didSelfHitFromConfusion) {
    // Only log general faint from status if not specifically from confusion self-hit leading to faint
    logs.push({ text: `${currentCombatant.name} fainted from its status condition!`, category: 'FAINTED', sourceId: currentCombatant.id });
  }
  // If self-hit from confusion made HP <=0, the FAINTED log for that is handled in takeTurn based on outcome.

  return { updatedCombatant: currentCombatant, logs, continueTurn: canContinue, selfHitFromConfusion: didSelfHitFromConfusion };
}

// Refactored checkAccuracy
function checkAccuracy(move: MoveData, attacker: Combatant, defender: Combatant): { hit: boolean; logs: LogMessage[] } {
  const logs: LogMessage[] = [];
  let hitChance = move.accuracy !== undefined ? move.accuracy / 100 : 1.0; // Default 100% if no accuracy defined

  // Apply blindness effect from attacker
  if (attacker.statusConditions.some(s => s.type === 'blindness')) {
    hitChance *= 0.67; // Example: Blindness reduces accuracy by 1/3rd (multiplier of 0.67)
    // Log for blindness effect can be added here if desired, or assumed to be known
  }

  // Speed difference factor (simplified)
  const speedDiff = attacker.stats.spd - defender.stats.spd;
  let speedModifier = 0;
  if (speedDiff > 20) speedModifier = 0.1; // Attacker faster, +10% accuracy
  else if (speedDiff < -20) speedModifier = -0.1; // Attacker slower, -10% accuracy
  hitChance += speedModifier;

  hitChance = Math.max(0.1, Math.min(1.0, hitChance)); // Clamp between 10% and 100%

  const isHit = Math.random() < hitChance;
  if (!isHit) {
    logs.push({ text: `${attacker.name}'s ${move.name} missed ${defender.name}!`, category: 'ACCURACY_MISS', sourceId: attacker.id, targetId: defender.id });
  }
  return { hit: isHit, logs };
}

// Main takeTurn function - to be refactored in next step
export function takeTurn(attackerInput: Combatant, defenderInput: Combatant, moveId: MoveId): TurnResult {
  let currentAttacker = JSON.parse(JSON.stringify(attackerInput)) as Combatant;
  let currentDefender = JSON.parse(JSON.stringify(defenderInput)) as Combatant;
  const turnLogs: LogMessage[] = [];
  let outcome: TurnResult['outcome'] = 'no_effect'; // Default outcome

  const move = moves[moveId];
  if (!move) {
    turnLogs.push({ text: `Error: Move ${moveId} not found.`, category: 'NO_EFFECT', sourceId: currentAttacker.id });
    return { attackerState: currentAttacker, defenderState: currentDefender, logs: turnLogs, outcome: 'no_effect' };
  }

  // 0. Announce the move (already done if placeholder removed, if not, add here)
  // turnLogs.push({text: `${currentAttacker.name} used ${move.name}!`, category: 'MOVE_USAGE', sourceId: currentAttacker.id });

  // 1. Handle start-of-turn status effects for the attacker
  const sotEffects = handleStartOfTurnStatuses(currentAttacker);
  currentAttacker = sotEffects.updatedCombatant;
  turnLogs.push(...sotEffects.logs);

  if (currentAttacker.stats.hp <= 0 && !sotEffects.selfHitFromConfusion) {
    // Fainted from status before acting (e.g. poison)
    // FAINTED log is pushed by handleStartOfTurnStatuses if HP reached 0 due to status damage
    outcome = 'fainted_self';
    return { attackerState: currentAttacker, defenderState: currentDefender, logs: turnLogs, outcome };
  }
  if (sotEffects.selfHitFromConfusion) {
    if (currentAttacker.stats.hp <= 0) {
      // Fainted from confusion self-hit
      turnLogs.push({ text: `${currentAttacker.name} fainted from hitting itself in confusion!`, category: 'FAINTED', sourceId: currentAttacker.id });
      outcome = 'fainted_self';
    } else {
      // Survived self-hit, turn ends
      outcome = 'self_hit';
    }
    return { attackerState: currentAttacker, defenderState: currentDefender, logs: turnLogs, outcome };
  }
  if (!sotEffects.continueTurn) { // E.g., sleep, freeze, or other status preventing action
    outcome = 'no_effect'; // Log about inability to move is pushed by handleStartOfTurnStatuses
    return { attackerState: currentAttacker, defenderState: currentDefender, logs: turnLogs, outcome };
  }
  
  // Announce move usage if turn continues
  turnLogs.push({text: `${currentAttacker.name} used ${move.name}!`, category: 'MOVE_USAGE', sourceId: currentAttacker.id });

  // 2. Check accuracy
  const accuracyCheck = checkAccuracy(move, currentAttacker, currentDefender);
  turnLogs.push(...accuracyCheck.logs);
  if (!accuracyCheck.hit) {
    return { attackerState: currentAttacker, defenderState: currentDefender, logs: turnLogs, outcome: 'miss' };
  }

  // 3. Apply move effects
  let effectAppliedThisTurn = false;
  let damageDealtThisTurn = 0;

  // 3a. Handle direct damage from move.power
  if (move.power > 0 && (move.category === "offense" || move.category === "defense")) { // Assuming defense moves can have power for e.g. recoil or fixed damage
    // Basic damage calculation (expand with type effectiveness later)
    let baseDamage = move.power;
    let calculatedDamage = Math.floor(baseDamage + (currentAttacker.stats.atk / 2) - (currentDefender.stats.def / 3));
    calculatedDamage = Math.max(1, calculatedDamage); // Ensure at least 1 damage

    // TODO: Implement type effectiveness
    const effectiveness = 1.0; // Placeholder
    let actualDamage = Math.floor(calculatedDamage * effectiveness);

    currentDefender.stats.hp = Math.max(0, currentDefender.stats.hp - actualDamage);
    damageDealtThisTurn += actualDamage;
    turnLogs.push({
      text: `${move.name} dealt ${actualDamage} damage to ${currentDefender.name}.`,
      category: 'DAMAGE_DEALT',
      sourceId: currentAttacker.id,
      targetId: currentDefender.id
    });
    effectAppliedThisTurn = true;

    if (effectiveness > 1) turnLogs.push({ text: "It's super effective!", category: 'EFFECTIVENESS', targetId: currentDefender.id });
    else if (effectiveness < 1 && effectiveness > 0) turnLogs.push({ text: "It's not very effective...", category: 'EFFECTIVENESS', targetId: currentDefender.id });
    else if (effectiveness === 0) turnLogs.push({ text: `It doesn't affect ${currentDefender.name}...`, category: 'NO_EFFECT', targetId: currentDefender.id });
  }

  // 3b. Handle other effects (status, stat changes)
  for (const effect of (move.effects || [])) {
    switch (effect.type) {
      case 'apply_status':
        const targetForStatus = effect.target === 'self' ? currentAttacker : currentDefender;
        const statusResult = applyStatus(targetForStatus, effect, move.name, currentAttacker.name);
        turnLogs.push(...statusResult.logs);
        if (statusResult.applied) effectAppliedThisTurn = true;
        break;
      case 'stat_change':
        const targetForStatChange = effect.target === 'self' ? currentAttacker : currentDefender;
        const stat = effect.stat as keyof Combatant['stats']; // Assuming Stat type from moves.ts is compatible
        
        // Simplified stat change logic, directly modifying stats
        // A more complex system would use stages and caps
        const currentStatVal = targetForStatChange.stats[stat];
        let newStatVal = currentStatVal;

        // Assuming effect.stages directly means number of stages. Convert stages to points or multiplier as needed.
        // For now, let's say 1 stage = 10% of a base stat or a fixed amount. Let's use fixed amount for simplicity.
        const changePerStage = 10; // Example: each stage changes stat by 10 points
        newStatVal += effect.stages * changePerStage;
        
        if (stat !== 'hp') newStatVal = Math.max(1, newStatVal); // Prevent non-HP stats from going below 1
        // Add caps if necessary, e.g., Math.min(newStatVal, MAX_STAT_VALUE)

        targetForStatChange.stats[stat] = newStatVal;
        
        const direction = effect.stages > 0 ? "rose" : "fell";
        const possessive = targetForStatChange.id === currentAttacker.id ? "Its" : `${targetForStatChange.name}'s`;
        turnLogs.push({
          text: `${possessive} ${stat} ${direction}!`,
          category: 'STAT_CHANGE',
          sourceId: targetForStatChange.id
        });
        effectAppliedThisTurn = true;
        break;
    }
  }

  // 4. Determine final outcome
  if (currentDefender.stats.hp <= 0) {
    turnLogs.push({ text: `${currentDefender.name} fainted!`, category: 'FAINTED', sourceId: currentDefender.id });
    outcome = 'fainted_target';
  } else if (effectAppliedThisTurn || damageDealtThisTurn > 0) {
    outcome = 'hit';
  } else {
    // If no damage and no effect, it's 'no_effect'
    // Specific logs for immunity or failure might have already been pushed.
    // Add a generic one if nothing else indicated why there was no effect.
    if (!turnLogs.some(log => log.category === 'NO_EFFECT' || (log.category === 'EFFECTIVENESS' && log.text.includes("doesn't affect")))) {
        if (move.power > 0 && !(damageDealtThisTurn > 0)) {
             // A damage move was used but did no damage and wasn't explicitly ineffective (e.g. power was too low vs def)
             turnLogs.push({ text: `${move.name} had no effect on ${currentDefender.name}.`, category: 'NO_EFFECT', sourceId: currentAttacker.id, targetId: currentDefender.id });
        } else if (!(move.power > 0) && !effectAppliedThisTurn) {
            // A non-damaging move that also had no other effect explicitly applied.
            turnLogs.push({ text: `${move.name} had no effect.`, category: 'NO_EFFECT', sourceId: currentAttacker.id });
        }
    }
    outcome = 'no_effect'; // Fallback if not already set by immunity etc.
  }

  return { attackerState: currentAttacker, defenderState: currentDefender, logs: turnLogs, outcome };
}