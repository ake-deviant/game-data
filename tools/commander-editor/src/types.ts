export const PAWN_COLORS = ['red', 'blue', 'green'] as const;
export const PAWN_TYPES = ['melee', 'ranged'] as const;
export const DEFAULT_PAWN_TYPES = ['melee', 'ranged', 'sapper'] as const;
export const MOVEMENT_STRATEGIES = ['after-first-match', '1-match-1-move'] as const;

export type PawnColor = (typeof PAWN_COLORS)[number];
export type PawnType = (typeof PAWN_TYPES)[number];
export type DefaultPawnType = (typeof DEFAULT_PAWN_TYPES)[number];
export type MovementStrategy = (typeof MOVEMENT_STRATEGIES)[number];

export interface SkillDefinition {
  id: string;
  displayName: string;
  visualKey: string;
}

export interface SkillsData {
  passivePawnSkills: SkillDefinition[];
  activablePlayerSkills: SkillDefinition[];
}

export interface PawnStats {
  id: string;
  displayName?: string;
  color: PawnColor;
  type: PawnType;
  turnCount: number;
  power: number;
  countPawns: number;
  moveCount: number;
  visualKey: string;
  requiredInfluencePoints?: number;
  skills?: string[];
  powerBonusPerDecrement?: number;
}

export interface CommanderStats {
  pawnMax: number;
  health: number;
  maxDefenseLevel: number;
  defensePowerPerLevel: number;
  attackPowerByColor: Record<PawnColor, number>;
  attackTurnCountByColor: Record<PawnColor, number>;
  nonePowerByColor: Record<PawnColor, number>;
  pawnTypeByColor: Record<PawnColor, DefaultPawnType>;
  pawnVisualKeyByColor: Record<PawnColor, string>;
  commanderPawns: PawnStats[];
  officerPawns: PawnStats[];
  movementsPerTurn: number;
  skills?: string[];
  innateSkills?: string[];
  freeRecruitThreshold?: number;
  skillsByColor?: Partial<Record<PawnColor, string[]>>;
  powerBonusPerDecrementByColor?: Partial<Record<PawnColor, number>>;
  movementBonusStrategies?: {
    place?: MovementStrategy;
    remove?: MovementStrategy;
  };
}

export interface Commander {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  baseStats: CommanderStats;
}

export interface PawnFormState {
  key: string;
  id: string;
  displayName: string;
  color: PawnColor;
  type: PawnType;
  turnCount: number;
  power: number;
  countPawns: number;
  moveCount: number;
  visualKey: string;
  requiredInfluencePoints: number | '';
  skills: string[];
  powerBonusPerDecrement: number | '';
}

export interface CommanderFormState {
  id: string;
  name: string;
  description: string;
  icon: string;
  pawnMax: number;
  health: number;
  maxDefenseLevel: number;
  defensePowerPerLevel: number;
  movementsPerTurn: number;
  attackPowerByColor: Record<PawnColor, number>;
  attackTurnCountByColor: Record<PawnColor, number>;
  nonePowerByColor: Record<PawnColor, number>;
  pawnTypeByColor: Record<PawnColor, DefaultPawnType>;
  pawnVisualKeyByColor: Record<PawnColor, string>;
  commanderPawns: PawnFormState[];
  officerPawns: PawnFormState[];
  skills: string[];
  innateSkills: string[];
  freeRecruitThreshold: number | '';
  skillsByColor: Record<PawnColor, string[]>;
  powerBonusPerDecrementByColor: Record<PawnColor, number | ''>;
  movementBonusStrategies: {
    place: MovementStrategy | '';
    remove: MovementStrategy | '';
  };
}
