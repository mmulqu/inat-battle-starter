export const moves: { [key: string]: MoveData } = {
  leapStrike: {
    id: "leapStrike",
    name: "Leap Strike",
    power: 25,
    type: "Electric",
    category: "offense" as const
  },
  webSnare: {
    id: "webSnare",
    name: "Web Snare",
    power: 15,
    type: "Grass",
    category: "offense" as const
  },
  sporeBurst: {
    id: "sporeBurst",
    name: "Spore Burst",
    power: 20,
    type: "Poison",
    category: "offense" as const
  },
  harden: {
    id: "harden",
    name: "Harden",
    power: 0,
    type: "Normal",
    category: "defense" as const,
    effects: [
      {
        type: "stat_change" as const,
        stat: "def" as const,
        stages: 1,
        target: "self" as const
      }
    ]
  },
  wingSlice: {
     id: "wingSlice",
     name: "Wing Slice",
     power: 30,
     type: "Flying",
     category: "offense" as const
   },
   sharpen: {
    id: "sharpen",
    name: "Sharpen",
    power: 0,
    type: "Normal",
    category: "defense" as const,
    effects: [
      {
        type: "stat_change" as const,
        stat: "atk" as const,
        stages: 1,
        target: "self" as const
      }
    ]
  },
  toxicSting: {
    id: "toxicSting",
    name: "Toxic Sting",
    power: 10,
    type: "Poison",
    category: "offense",
    effects: [
        { type: "apply_status", status: "poison", target: "opponent", chance: 0.3 }
    ]
  },
  confuseRay: {
    id: "confuseRay",
    name: "Confuse Ray",
    power: 0,
    type: "Ghost",
    category: "status",
    effects: [
        { type: "apply_status", status: "confusion", target: "opponent", duration: 3 }
    ]
  },
  sandAttack: {
    id: "sandAttack",
    name: "Sand Attack",
    power: 0,
    type: "Ground",
    category: "status",
    effects: [
        { type: "apply_status" as const, status: "blindness", target: "opponent", duration: 4, chance: 0.8 }
    ]
  }
};

export type MoveId = keyof typeof moves;

export type StatusCondition = "poison" | "confusion" | "blindness";

export interface ActiveStatusCondition {
    type: StatusCondition;
    duration?: number;
}

type Stat = "hp" | "atk" | "def" | "spd" | "accuracy" | "evasion";
type EffectTarget = "self" | "opponent";

export interface StatChangeEffect {
    type: "stat_change";
    stat: Exclude<Stat, "hp">;
    stages: number;
    target: EffectTarget;
}

export interface ApplyStatusEffect {
    type: "apply_status";
    status: StatusCondition;
    target: EffectTarget;
    duration?: number;
    chance?: number;
}

export type MoveEffect = StatChangeEffect | ApplyStatusEffect;

export interface MoveData {
    id: MoveId;
    name: string;
    power: number;
    type: string;
    category: "offense" | "defense" | "status";
    effects?: MoveEffect[];
    accuracy?: number;
}
  