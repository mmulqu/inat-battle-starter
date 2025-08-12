import { moves } from "../data/moves";

export interface Combatant {
  id: string;
  name: string;
  type: string;
  stats: { hp: number; atk: number; def: number; spd: number; int: number };
  moves: (keyof typeof moves)[];
}

export function takeTurn(
  attacker: Combatant,
  defender: Combatant,
  moveKey: keyof typeof moves
) {
  const move = moves[moveKey];

  // Handle non-offense categories (defense/status) with simple buff/effect application
  if (move?.category && move.category !== "offense") {
    // Example: Harden -> { effect: { stat: 'def', stages: 1 } }
    const effect = (move as any).effect;
    if (effect && typeof effect === 'object') {
      const targetStat = effect.stat as keyof Combatant["stats"]; // 'atk' | 'def' | 'spd' | 'int' | 'hp'
      const stages = Math.max(1, Math.min(3, Number(effect.stages ?? 1)));

      if (targetStat && targetStat !== 'hp') {
        // Simple buff: +5 per stage
        const increment = 5 * stages;
        const current = attacker.stats[targetStat] as number;
        attacker.stats[targetStat] = Math.max(1, Math.round(current + increment)) as any;
        return {
          log: `${attacker.name} used ${move.name}. ${String(targetStat).toUpperCase()} rose!`,
          defenderHp: defender.stats.hp,
        };
      }
    }
    // Default behavior for status-like moves without numeric effects
    return {
      log: `${attacker.name} used ${move?.name ?? 'a move'}!`,
      defenderHp: defender.stats.hp,
    };
  }

  // Default offensive move damage calculation
  const damage = Math.max(
    1,
    Math.round((move.power * attacker.stats.atk) / Math.max(1, defender.stats.def))
  );

  defender.stats.hp = Math.max(0, defender.stats.hp - damage);

  return {
    log: `${attacker.name} used ${move.name}, dealing ${damage} damage!`,
    defenderHp: defender.stats.hp
  };
}
