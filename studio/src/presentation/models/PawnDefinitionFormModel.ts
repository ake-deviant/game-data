export type PawnRole = 'soldier' | 'officer' | 'commander';
export type PawnColor = 'red' | 'blue' | 'green';
export type PawnType = 'melee' | 'ranged';

export interface PawnDefinitionFormModel {
  readonly id: string;
  readonly role: PawnRole;
  readonly color: PawnColor;
  readonly type: PawnType;
  readonly displayName: string;
  readonly power: number;
  readonly turnCount: number;
  readonly nonePower: number;
  readonly countPawns: number;
  readonly moveCount: number;
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly requiredInfluencePoints: number;
  readonly skills: readonly string[];
  readonly implicitSkillParams: {
    readonly powerBonusPerDecrement: string;
    readonly columnPowerBonusPerDecrement: string;
    readonly spBonusPerLiaison: string;
    readonly spBonusPerAttackPawn: string;
    readonly freeWallDestructsOnDecrement: string;
    readonly liaisonBonusPercent: string;
    readonly spGrowthBonus: string;
  };
}

export function createEmptyPawnDefinitionForm(): PawnDefinitionFormModel {
  return {
    id: '',
    role: 'soldier',
    color: 'red',
    type: 'melee',
    displayName: '',
    power: 5,
    turnCount: 2,
    nonePower: 1,
    countPawns: 3,
    moveCount: 1,
    visualKey: '',
    weaponKey: '',
    requiredInfluencePoints: 0,
    skills: [],
    implicitSkillParams: {
      powerBonusPerDecrement: '',
      columnPowerBonusPerDecrement: '',
      spBonusPerLiaison: '',
      spBonusPerAttackPawn: '',
      freeWallDestructsOnDecrement: '',
      liaisonBonusPercent: '',
      spGrowthBonus: '',
    },
  };
}
