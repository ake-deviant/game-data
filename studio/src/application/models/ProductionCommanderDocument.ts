export interface ProductionSkillAssignment {
  readonly id: string;
  readonly initialLevel: number;
  readonly maxLevel: number;
}

export interface ProductionPawnDocument {
  readonly id: string;
  readonly displayName?: string;
  readonly color: string;
  readonly type: string;
  readonly turnCount: number;
  readonly power: number | { readonly startPower: number; readonly powerBonusPerDecrement?: number };
  readonly countPawns?: number;
  readonly moveCount?: number;
  readonly nonePower?: number;
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly requiredInfluencePoints?: number;
  readonly skills?: readonly (string | ProductionSkillAssignment)[];
  readonly innateSkillLevels?: Readonly<Record<string, number>>;
  readonly maxSkillLevels?: Readonly<Record<string, number>>;
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
    readonly skills?: readonly (string | ProductionSkillAssignment)[];
    readonly innateSkills?: readonly string[];
    readonly innateSkillLevels?: Readonly<Record<string, number>>;
    readonly maxSkillLevels?: Readonly<Record<string, number>>;
    readonly freeRecruitThreshold?: number;
  };
}
