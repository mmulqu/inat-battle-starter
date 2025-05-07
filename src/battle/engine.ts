import { moves, MoveData, ApplyStatusEffect } from "../data/moves";
import { SpeciesId } from "../data/species";

// Accuracy and Evasion Constants
const DEFAULT_MOVE_ACCURACY = 0.95; // Default accuracy if move doesn't specify one (e.g., 95%)
const BLINDNESS_ACCURACY_MULTIPLIER = 0.5; // Blindness reduces accuracy by 50%
const SPEED_SCALING_DIVISOR = 10;    // For every X points of speed difference
const DODGE_PERCENT_PER_SCALING_GROUP = 0.05; // Y% increased dodge chance
const MAX_SPEED_DODGE_BONUS = 0.30;  // Max dodge chance bonus from speed alone (e.g., 30%)
const MIN_HIT_CHANCE = 0.10;         // Minimum hit chance (e.g., 10%)
const MAX_HIT_CHANCE = 1.0;          // Maximum possible hit chance (100%)

// Add new interface ActiveStatusCondition
export interface ActiveStatusCondition {
    type: "poison" | "confusion" | "blindness"; // etc.
    duration?: number; // Turns remaining; undefined if permanent until cured
    // Add other properties specific to a status, e.g., confusion's self-hit chance
}

export interface Combatant {
  id: string;
  name: string;
  type: string;
  stats: { hp: number; atk: number; def: number; spd: number; int: number };
  moves: (keyof typeof moves)[];
  statusConditions: ActiveStatusCondition[]; // Array to hold current statuses
  maxHp: number; // Added maxHp for calculations
  speciesId: SpeciesId; // Added speciesId
}

export interface TurnResult {
  logs: string[];
  attackerState: Combatant;
  defenderState: Combatant;
  outcome: "normal" | "miss" | "self_hit" | "no_effect" | "fainted_target";
}

export function takeTurn(
  attackerInput: Combatant,
  defenderInput: Combatant,
  moveKey: keyof typeof moves
): TurnResult {
  let attacker = { ...attackerInput, speciesId: attackerInput.speciesId }; // Work with copies
  let defender = { ...defenderInput, speciesId: defenderInput.speciesId };
  const move = moves[moveKey];
  let turnLogs: string[] = [];
  let outcome: TurnResult["outcome"] = "normal";

  // 1. Handle start-of-turn statuses for the attacker
  const startOfTurnEffects = handleStartOfTurnStatuses(attacker);
  turnLogs = turnLogs.concat(startOfTurnEffects.logs);
  attacker = startOfTurnEffects.updatedCombatant;

  if (startOfTurnEffects.damageTakenFromPoison > 0) {
    attacker.stats.hp = Math.max(0, attacker.stats.hp - startOfTurnEffects.damageTakenFromPoison);
    if (attacker.stats.hp === 0) {
      // Attacker fainted from poison before they could move
      turnLogs.push(`${attacker.name} fainted from poison!`);
      return {
        logs: turnLogs,
        attackerState: attacker,
        defenderState: defender,
        outcome: "no_effect", // Or a new outcome like "attacker_fainted_from_status"
      };
    }
  }
  if (startOfTurnEffects.confusionSelfDamage > 0) {
    attacker.stats.hp = Math.max(0, attacker.stats.hp - startOfTurnEffects.confusionSelfDamage);
    if (attacker.stats.hp === 0) {
      turnLogs.push(`${attacker.name} fainted from confusion!`);
      // No need to return outcome: "self_hit" if fainted, this log is enough before normal fainted check
    } 
  }
  
  if (startOfTurnEffects.turnSkipped) {
    // If turn skipped due to confusion self-hit (and didn't faint from it)
    return {
      logs: turnLogs,
      attackerState: attacker,
      defenderState: defender,
      outcome: "self_hit",
    };
  }
  
  // If attacker fainted from status effect damage before their move
  if (attacker.stats.hp <= 0) {
    return {
      logs: turnLogs,
      attackerState: attacker,
      defenderState: defender,
      outcome: "no_effect", // Or a specific fainted outcome
    };
  }

  turnLogs.push(`${attacker.name} uses ${move.name}!`);

  // 2. Check accuracy (blindness, etc.)
  const accuracyCheck = checkAccuracy(attacker, defender, move);
  turnLogs = turnLogs.concat(accuracyCheck.logs);

  if (!accuracyCheck.hit) {
    return {
      logs: turnLogs,
      attackerState: attacker,
      defenderState: defender,
      outcome: "miss",
    };
  }

  // 3. If hit, calculate damage and apply effects
  let damageDealt = 0;
  if (move.power > 0 && move.category === "offense") {
    damageDealt = Math.max(
      1,
      Math.round((move.power * attacker.stats.atk) / defender.stats.def) // Basic damage calc
    );
    defender.stats.hp = Math.max(0, defender.stats.hp - damageDealt);
    turnLogs.push(`${move.name} dealt ${damageDealt} damage to ${defender.name}.`);
    if (defender.stats.hp === 0) {
      turnLogs.push(`${defender.name} fainted!`);
      outcome = "fainted_target";
    }
  } else if (move.category !== "status") {
    turnLogs.push(`${move.name} had no direct damage effect.`);
  }

  // 4. Apply status effects from the move
  if (move.effects) {
    for (const effect of move.effects) {
      if (effect.type === "apply_status") {
        const statusEffect = effect as ApplyStatusEffect; // Type assertion
        const targetCombatant = statusEffect.target === "self" ? attacker : defender;
        
        // Store current number of statuses before applying a new one
        const prevStatusCount = targetCombatant.statusConditions.length;
        applyStatus(targetCombatant, statusEffect.status, statusEffect.duration, statusEffect.chance);
        
        // Check if a new status was actually added by applyStatus
        // This is a bit indirect; applyStatus logs directly. 
        // For more robust logging, applyStatus should return if it succeeded/what it did.
        if (targetCombatant.statusConditions.length > prevStatusCount || 
            targetCombatant.statusConditions.find(sc => sc.type === statusEffect.status && sc.duration === statusEffect.duration)) {
          // This condition is imperfect, relies on applyStatus internal logic not changing much
          // A better way: applyStatus returns a success/log message.
          if (statusEffect.target === "self"){
            turnLogs.push(`${attacker.name} is now ${statusEffect.status}!`);
          } else {
             turnLogs.push(`${defender.name} is now ${statusEffect.status}!`);
          }
        } else if (targetCombatant.statusConditions.find(sc => sc.type === statusEffect.status)) {
            // Status was already there, or chance failed (applyStatus logs this)
            // We can add a generic log or rely on applyStatus logs.
            // For now, let's assume applyStatus logged the specifics of chance fail / already applied.
        }
      }
      // TODO: Handle other effect types like "stat_change"
      else if (effect.type === "stat_change") {
        const statEffect = effect; // Already correct type from MoveEffect union
        const targetStatCombatant = statEffect.target === "self" ? attacker : defender;
        
        // For simplicity, directly modify stats. In a more complex system, you might have temporary stat stages.
        let statToChange = statEffect.stat as keyof typeof targetStatCombatant.stats;
        
        // Assuming stages directly increase/decrease the stat value for now
        // A more Pokemon-like system would use multipliers or bounded stages.
        const currentStatValue = targetStatCombatant.stats[statToChange];
        const newStatValue = currentStatValue + statEffect.stages * 5; // Arbitrary change factor, e.g., 5 points per stage
        
        targetStatCombatant.stats[statToChange] = Math.max(1, newStatValue); // Prevent stats from dropping too low

        const changeVerb = statEffect.stages > 0 ? "increased" : "decreased";
        const possessive = statEffect.target === "self" ? "its" : `${targetStatCombatant.name}'s`;
        
        let fullStatName = statEffect.stat.toUpperCase(); // Default to uppercase if not in map
        switch (statEffect.stat) {
            case "atk": fullStatName = "Attack"; break;
            case "def": fullStatName = "Defense"; break;
            case "spd": fullStatName = "Speed"; break;
            case "int": fullStatName = "Intelligence"; break;
        }

        turnLogs.push(`${attacker.name}'s move ${changeVerb} ${possessive} ${fullStatName}!`);
      }
    }
  }

  console.log("[DEBUG engine.ts takeTurn] Returning attackerState.statusConditions:", attacker.statusConditions);
  console.log("[DEBUG engine.ts takeTurn] Returning defenderState.statusConditions:", defender.statusConditions);

  return {
    logs: turnLogs,
    attackerState: attacker,
    defenderState: defender,
    outcome: defender.stats.hp === 0 ? "fainted_target" : outcome, // Ensure fainted_target persists if set
  };
}

// Helper Functions
export function applyStatus(
  target: Combatant,
  statusType: "poison" | "confusion" | "blindness",
  duration?: number,
  chance?: number // Added chance parameter from MoveEffect
) {
  // Handle chance of application
  if (chance !== undefined && Math.random() > chance) {
    console.log(`${target.name} avoided the ${statusType}!`);
    return; // Status not applied
  }

  const existingStatusIndex = target.statusConditions.findIndex(
    (sc) => sc.type === statusType
  );

  if (existingStatusIndex !== -1) {
    // Status already active. For now, let's just log it.
    // Later, we could refresh duration or have more complex logic.
    console.log(`${target.name} is already ${statusType}.`);
    // Optionally, update duration if the new one is longer or permanent
    if (duration === undefined) { // Permanent
      target.statusConditions[existingStatusIndex].duration = undefined;
    } else if (target.statusConditions[existingStatusIndex].duration !== undefined && duration > (target.statusConditions[existingStatusIndex].duration || 0)) {
      target.statusConditions[existingStatusIndex].duration = duration;
    }
    return;
  }

  const newStatus: ActiveStatusCondition = { type: statusType, duration };
  target.statusConditions.push(newStatus);
  console.log(`${target.name} is now ${statusType}${duration ? ` for ${duration} turns` : ''}.`);
}

export function handleStartOfTurnStatuses(combatant: Combatant) {
  const logs: string[] = [];
  let damageTakenThisTurn = 0;
  let turnSkipped = false;
  let attackerSelfDamage = 0; // For confusion self-hit

  const nextStatusConditions: ActiveStatusCondition[] = [];

  for (const status of combatant.statusConditions) {
    let activeStatus = { ...status }; // Copy status to modify duration

    // Poison: Deals damage at the start of the turn
    if (activeStatus.type === "poison") {
      const poisonDamage = Math.max(1, Math.floor(combatant.maxHp * 0.05)); // 5% of max HP, min 1
      // combatant.stats.hp = Math.max(0, combatant.stats.hp - poisonDamage); // HP reduction will be handled by takeTurn or a central applyDamage function
      damageTakenThisTurn += poisonDamage;
      logs.push(`${combatant.name} took ${poisonDamage} damage from poison.`);
    }

    // Confusion: Chance to hit self, or snap out of it
    if (activeStatus.type === "confusion") {
      if (activeStatus.duration !== undefined && activeStatus.duration <= 1) { // Last turn of confusion or already expired
        logs.push(`${combatant.name} snapped out of confusion!`);
        // Status will be removed below as duration becomes 0 or less
      } else {
        // Still confused, roll for self-hit (e.g., 33% chance)
        if (Math.random() < 0.33) {
          attackerSelfDamage = Math.max(1, Math.floor(combatant.stats.atk * 0.5)); // Example: 50% of own Atk, min 1
          // combatant.stats.hp = Math.max(0, combatant.stats.hp - attackerSelfDamage); // HP reduction handled later
          logs.push(`${combatant.name} is confused and hit itself for ${attackerSelfDamage} damage!`);
          turnSkipped = true;
          // If turn is skipped due to confusion, other statuses for this turn might still tick (like poison above)
          // but the main move is skipped.
        }
      }
    }

    // Decrement duration for non-permanent statuses
    if (activeStatus.duration !== undefined) {
      activeStatus.duration -= 1;
      if (activeStatus.duration > 0) {
        nextStatusConditions.push(activeStatus);
      } else {
        logs.push(`${combatant.name} is no longer ${activeStatus.type}.`);
      }
    } else {
      nextStatusConditions.push(activeStatus); // Permanent status
    }
  }

  combatant.statusConditions = nextStatusConditions;

  // The actual HP reduction from poison/confusion self-hit will be applied in takeTurn
  // This function primarily determines the effects and logs them.

  return {
    logs,
    damageTakenFromPoison: damageTakenThisTurn, // Specific to poison for clarity
    confusionSelfDamage: attackerSelfDamage, // Specific to confusion
    turnSkipped,
    updatedCombatant: { ...combatant } // Return a copy of the combatant with updated statuses
  };
}

export function checkAccuracy(
  attacker: Combatant,
  defender: Combatant,
  move: MoveData
) {
  let logMessages: string[] = [];
  // Start with move's own accuracy, or default if not specified
  let currentHitChance = move.accuracy ?? DEFAULT_MOVE_ACCURACY;

  // Only apply these checks for offensive moves, or perhaps configurable per move category
  if (move.category === "offense") {
    // 1. Blindness Check (Attacker)
    const isAttackerBlind = attacker.statusConditions.find(sc => sc.type === "blindness");
    if (isAttackerBlind) {
      currentHitChance *= BLINDNESS_ACCURACY_MULTIPLIER;
      // No specific log here for blindness reducing hit chance, 
      // it contributes to the overall miss if it happens.
      // A log could be added if desired: logMessages.push(`${attacker.name} is blind, making the attack less accurate!`);
    }

    // 2. Speed-Based Dodge Calculation (Defender)
    const speedDifference = defender.stats.spd - attacker.stats.spd;
    let dodgeChanceIncrease = 0;

    if (speedDifference > 0) {
      // Calculate how many "groups" of speed points the defender is faster by
      const speedAdvantageGroups = Math.floor(speedDifference / SPEED_SCALING_DIVISOR);
      if (speedAdvantageGroups > 0) {
        dodgeChanceIncrease = speedAdvantageGroups * DODGE_PERCENT_PER_SCALING_GROUP;
        // Cap the dodge bonus from speed
        dodgeChanceIncrease = Math.min(dodgeChanceIncrease, MAX_SPEED_DODGE_BONUS);
      }
    }
    currentHitChance -= dodgeChanceIncrease;

    // Apply overall Min/Max Hit Chance limits AFTER all modifiers
    currentHitChance = Math.max(MIN_HIT_CHANCE, currentHitChance);
    currentHitChance = Math.min(MAX_HIT_CHANCE, currentHitChance);

  } else {
    // For non-offensive moves (status, defense), assume they always hit for now.
    // This could be made configurable per move if some status moves should also miss.
    return { hit: true, logs: logMessages };
  }
  
  // Roll for the hit
  const hitRoll = Math.random();
  if (hitRoll < currentHitChance) {
    return { hit: true, logs: logMessages }; // Hit!
  } else {
    // Missed! Determine primary reason for log if possible, or a generic miss.
    if (move.category === "offense") {
        // If dodgeChanceIncrease was significant, it might be a speed-based miss.
        // The check for blindness is already factored into currentHitChance.
        // For a more specific log, you might need to check which factor was dominant.
        // For now, a generic miss log when accuracy check fails.
        logMessages.push(`${attacker.name}'s ${move.name} missed ${defender.name}!`);
    }
    return { hit: false, logs: logMessages }; // Miss!
  }
}