import type { PawnColor } from '../value-objects/PawnIdentity.ts';
import { PawnDefinitionId } from '../value-objects/PawnDefinitionId.ts';
import type { SkillId } from '../value-objects/SkillId.ts';

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
    Commander.assertSkillsConstraints(props.baseStats);
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

  private static assertUniqueChargeSkill(skills: readonly SkillId[], label: string): void {
    const charges = skills.filter((id) => /^charge-\d+$/.test(id.value));
    if (charges.length > 1) {
      throw new Error(`${label} cannot contain more than one charge skill.`);
    }
  }

  private static assertSkillsConstraints(stats: CommanderStats): void {
    const { skills, innateSkills, skillsByColor } = stats;

    if (skills) Commander.assertUniqueChargeSkill(skills, 'Commander skills');
    if (innateSkills) Commander.assertUniqueChargeSkill(innateSkills, 'Commander innate skills');

    if (skills && innateSkills) {
      const overlap = skills.find((s) => innateSkills.some((i) => i.equals(s)));
      if (overlap) {
        throw new Error(`Skill '${overlap.value}' cannot be both activable and innate.`);
      }
    }

    if (skillsByColor) {
      for (const [color, colorSkills] of Object.entries(skillsByColor)) {
        if (colorSkills) Commander.assertUniqueChargeSkill(colorSkills, `Color '${color}' skills`);
      }
    }
  }
}
