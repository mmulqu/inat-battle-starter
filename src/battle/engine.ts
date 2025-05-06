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

  const damage = Math.max(
    1,
    Math.round((move.power * attacker.stats.atk) / defender.stats.def)
  );

  defender.stats.hp = Math.max(0, defender.stats.hp - damage);

  return {
    log: `${attacker.name} used ${move.name}, dealing ${damage} damage!`,
    defenderHp: defender.stats.hp
  };
}
