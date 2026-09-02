export const PAWN_COLORS = ['red', 'blue', 'green'] as const;
export const PAWN_TYPES = ['melee', 'ranged'] as const;
export const MOVEMENT_STRATEGIES = ['after-first-match', '1-match-1-move'] as const;

export type PawnColor = (typeof PAWN_COLORS)[number];
export type PawnType = (typeof PAWN_TYPES)[number];
export type MovementStrategy = (typeof MOVEMENT_STRATEGIES)[number];

export type WeaponKeysData = Record<PawnType, string[]>;

export interface WallVisualSetDefinition {
  id: string;
  keyByLevel: Record<string, string>;
}

export interface SkillDefinition {
  id: string;
  displayName: string;
  visualKey: string;
}

export const PAWN_SKILL_TRIGGER_PHASES = ['spawn', 'decrement', 'movePhase', 'attack'] as const;
export type PawnSkillTriggerPhase = (typeof PAWN_SKILL_TRIGGER_PHASES)[number];

export interface PawnSkillDefinition extends SkillDefinition {
  triggerPhase: PawnSkillTriggerPhase;
}

export interface SkillsData {
  pawnSkillVisuals: PawnSkillDefinition[];
  activablePlayerSkills: SkillDefinition[];
}

export interface PawnImplicitSkillParams {
  powerBonusPerDecrement?: number;
  columnPowerBonusPerDecrement?: number;
  spBonusPerLiaison?: number;
  spBonusPerAttackPawn?: number;
  freeWallDestructsOnDecrement?: number;
  liaisonBonusPercent?: number;
  spGrowthBonus?: number;
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
  weaponKey: string;
  requiredInfluencePoints?: number;
  skills?: string[];
  implicitSkillParams?: PawnImplicitSkillParams;
}

export interface CommanderStats {
  pawnMax: number;
  health: number;
  maxDefenseLevel: number;
  wallVisualSet: string;
  defensePowerPerLevel: number;
  attackPowerByColor: Record<PawnColor, number>;
  attackTurnCountByColor: Record<PawnColor, number>;
  nonePowerByColor: Record<PawnColor, number>;
  pawnTypeByColor: Record<PawnColor, PawnType>;
  pawnVisualKeyByColor: Record<PawnColor, string>;
  pawnWeaponKeyByColor: Record<PawnColor, string>;
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
  weaponKey: string;
  requiredInfluencePoints: number | '';
  skills: string[];
  powerBonusPerDecrement: number | '';
  columnPowerBonusPerDecrement: number | '';
  spBonusPerLiaison: number | '';
  spBonusPerAttackPawn: number | '';
  freeWallDestructsOnDecrement: number | '';
  liaisonBonusPercent: number | '';
  spGrowthBonus: number | '';
}

export interface CommanderFormState {
  id: string;
  name: string;
  description: string;
  icon: string;
  pawnMax: number;
  health: number;
  maxDefenseLevel: number;
  wallVisualSet: string;
  defensePowerPerLevel: number;
  movementsPerTurn: number;
  attackPowerByColor: Record<PawnColor, number>;
  attackTurnCountByColor: Record<PawnColor, number>;
  nonePowerByColor: Record<PawnColor, number>;
  pawnTypeByColor: Record<PawnColor, PawnType>;
  pawnVisualKeyByColor: Record<PawnColor, string>;
  pawnWeaponKeyByColor: Record<PawnColor, string>;
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
