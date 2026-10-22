import type { PawnIdentity } from '../value-objects/PawnIdentity.ts';
import type {
  PawnStats,
  SoldierPawnStats,
} from '../value-objects/PawnStats.ts';
import type { PawnVisual } from '../value-objects/PawnVisual.ts';
import type { SkillId } from '../value-objects/SkillId.ts';

export interface PawnImplicitSkillParams {
  powerBonusPerDecrement?: number;
  columnPowerBonusPerDecrement?: number;
  spBonusPerLiaison?: number;
  spBonusPerAttackPawn?: number;
  freeWallDestructsOnDecrement?: number;
  liaisonBonusPercent?: number;
  spGrowthBonus?: number;
}

export type PawnDefinitionStats = PawnStats | SoldierPawnStats;

export class PawnDefinition {
  public readonly identity: PawnIdentity;
  public readonly stats: PawnDefinitionStats;
  public readonly visual: PawnVisual;
  public readonly requiredInfluencePoints?: number;
  public readonly innateSkillLevels?: Readonly<Record<string, number>>;
  private readonly skillIds: readonly SkillId[];
  private readonly implicitParameters?: Readonly<PawnImplicitSkillParams>;

  public constructor(
    identity: PawnIdentity,
    stats: PawnDefinitionStats,
    visual: PawnVisual,
    requiredInfluencePoints?: number,
    skills: readonly SkillId[] = [],
    implicitSkillParams?: Readonly<PawnImplicitSkillParams>,
    innateSkillLevels?: Readonly<Record<string, number>>,
  ) {
    this.identity = identity;
    this.stats = stats;
    this.visual = visual;
    this.requiredInfluencePoints = requiredInfluencePoints;
    this.innateSkillLevels = innateSkillLevels ? { ...innateSkillLevels } : undefined;
    this.skillIds = [...skills];
    this.implicitParameters = implicitSkillParams
      ? { ...implicitSkillParams }
      : undefined;
  }

  public get skills(): readonly SkillId[] {
    return [...this.skillIds];
  }

  public get implicitSkillParams(): Readonly<PawnImplicitSkillParams> | undefined {
    return this.implicitParameters
      ? { ...this.implicitParameters }
      : undefined;
  }
}
