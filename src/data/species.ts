// src/data/species.ts
import { MoveId } from "./moves";

// Add Species type definition for better structure
export interface SpeciesData {
    id: string;
    name: string;
    type: string; // Or string[] for dual types later
    stats: { hp: number; atk: number; def: number; spd: number; int: number };
    moves: MoveId[]; // Use the imported MoveId type
    // Add sprite path later: sprite: string;
}

// Use a Record for type safety
export const species: Record<string, SpeciesData> = {
  jumpingSpider: {
    id: "jumpingSpider", // Use camelCase or consistent naming
    name: "Jumping Spider",
    type: "Electric", // Example type
    stats: { hp: 70, atk: 60, def: 40, spd: 55, int: 50 },
    moves: ["leapStrike", "webSnare"]
  },
  // --- NEW SPECIES ---
  puffballMushroom: {
    id: "puffballMushroom",
    name: "Puffball",
    type: "Poison", // Example type
    stats: { hp: 90, atk: 30, def: 65, spd: 20, int: 40 },
    moves: ["sporeBurst", "harden"] // Assign new moves
  },
  dragonfly: {
      id: "dragonfly",
      name: "Dragonfly",
      type: "Flying",
      stats: { hp: 65, atk: 55, def: 45, spd: 70, int: 45 },
      moves: ["wingSlice", "webSnare"] // Reuse a move
  }
};

export type SpeciesId = keyof typeof species;