export const moves = {
    leapStrike: {
      id: "leapStrike",
      name: "Leap Strike",
      power: 25,
      type: "Electric",
      category: "offense"
    },
    webSnare: {
      id: "webSnare",
      name: "Web Snare",
      power: 15,
      type: "Grass",
      category: "offense"
    },
        // --- NEW MOVES ---
  sporeBurst: {
    id: "sporeBurst",
    name: "Spore Burst",
    power: 20,
    type: "Poison", // Example type
    category: "offense"
  },
  harden: {
    id: "harden",
    name: "Harden",
    power: 0, // Defensive moves often have 0 power
    type: "Normal",
    category: "defense", // Add a defense category
    // We'll need to update the engine later to handle non-offense moves
    effect: { stat: "def", stages: 1 } // Example effect structure
  },
   wingSlice: {
     id: "wingSlice",
     name: "Wing Slice",
     power: 30,
     type: "Flying",
     category: "offense"
   },
};
  
  export type MoveId = keyof typeof moves;

// Add Move type definition for better structure
export interface Move {
    id: MoveId;
    name: string;
    power: number;
    type: string; // Consider making this a specific enum/union later
    category: 'offense' | 'defense' | 'status'; // Define categories
    effect?: any; // Define a proper effect type later
}
  