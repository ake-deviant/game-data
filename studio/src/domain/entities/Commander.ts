import type { PawnColor } from '../value-objects/PawnIdentity.ts';
import { PawnDefinitionId } from '../value-objects/PawnDefinitionId.ts';
import type { SkillId } from '../value-objects/SkillId.ts';

export type MovementStrategy = 'after-first-match' | '1-match-1-move';

export interface MovementBonusStrategies {
  place?: MovementStrategy;
  remove?: MovementStrategy;
}

export interface CommanderStats {
  pawnMax: number;
  health: number;
  maxDefenseLevel: number;
  wallVisualSet: string;
  defensePowerPerLevel: number;
  pawnDefinitionIdByColor: Record<PawnColor, PawnDefinitionId>;
  commanderPawnDefinitionIds: readonly PawnDefinitionId[];
  officerPawnDefinitionIds: readonly PawnDefinitionId[];
  movementsPerTurn: number;
  skills?: readonly SkillId[];
  innateSkills?: readonly SkillId[];
  freeRecruitThreshold?: number;
  skillsByColor?: Partial<Record<PawnColor, readonly SkillId[]>>;
  powerBonusPerDecrementByColor?: Partial<Record<PawnColor, number>>;
  movementBonusStrategies?: MovementBonusStrategies;
}

export interface CommanderProps {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  baseStats: CommanderStats;
}

export class Commander {
  private readonly props: CommanderProps;

  public constructor(props: CommanderProps) {
    Commander.assertSoldierColors(props.baseStats.pawnDefinitionIdByColor);
    this.props = {
      ...props,
      baseStats: {
        ...props.baseStats,
        pawnDefinitionIdByColor: { ...props.baseStats.pawnDefinitionIdByColor },
        commanderPawnDefinitionIds: [...props.baseStats.commanderPawnDefinitionIds],
        officerPawnDefinitionIds: [...props.baseStats.officerPawnDefinitionIds],
      },
    };
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get description(): string | undefined { return this.props.description; }
  public get icon(): string | undefined { return this.props.icon; }
  public get baseStats(): CommanderStats {
    return {
      ...this.props.baseStats,
      pawnDefinitionIdByColor: { ...this.props.baseStats.pawnDefinitionIdByColor },
      commanderPawnDefinitionIds: [...this.props.baseStats.commanderPawnDefinitionIds],
      officerPawnDefinitionIds: [...this.props.baseStats.officerPawnDefinitionIds],
    };
  }

  private static assertSoldierColors(
    soldiers: Record<PawnColor, PawnDefinitionId>,
  ): void {
    for (const color of ['red', 'blue', 'green'] as const) {
      const soldier = soldiers[color];
      if (!(soldier instanceof PawnDefinitionId) || soldier.value.length === 0) {
        throw new Error(`Commander must define a ${color} soldier.`);
      }
    }
  }
}
