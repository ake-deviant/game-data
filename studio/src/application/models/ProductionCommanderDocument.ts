export interface ProductionPawnDocument {
  readonly id: string;
  readonly displayName?: string;
  readonly color: string;
  readonly type: string;
  readonly turnCount: number;
  readonly power: number;
  readonly countPawns?: number;
  readonly moveCount?: number;
  readonly nonePower?: number;
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly requiredInfluencePoints?: number;
  readonly skills?: readonly string[];
  readonly implicitSkillParams?: Record<string, number>;
}

export interface ProductionCommanderDocument {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly baseStats: {
    readonly pawnMax: number;
    readonly health: number;
    readonly maxDefenseLevel: number;
    readonly wallVisualSet: string;
    readonly defensePowerPerLevel: number;
    readonly movementsPerTurn: number;
    readonly soldierPawns: readonly ProductionPawnDocument[];
    readonly commanderPawns: readonly ProductionPawnDocument[];
    readonly officerPawns: readonly ProductionPawnDocument[];
    readonly skills?: readonly string[];
    readonly innateSkills?: readonly string[];
    readonly freeRecruitThreshold?: number;
  };
}
