import type { SkillId } from '../value-objects/SkillId.ts';

export type PawnSkillTriggerPhase =
  | 'spawn'
  | 'decrement'
  | 'movePhase'
  | 'attack';

export interface SkillProps {
  id: SkillId;
  displayName: string;
  displayNameKey: string;
  descriptionKey: string;
  descriptionParams: Readonly<Record<string, string>>;
  visualKey: string;
}

export abstract class Skill<TProps extends SkillProps = SkillProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = props;
  }

  public get id(): SkillId { return this.props.id; }
  public get displayName(): string { return this.props.displayName; }
  public get displayNameKey(): string { return this.props.displayNameKey; }
  public get descriptionKey(): string { return this.props.descriptionKey; }
  public get descriptionParams(): Readonly<Record<string, string>> { return { ...this.props.descriptionParams }; }
  public get visualKey(): string { return this.props.visualKey; }
}

export interface PawnSkillProps extends SkillProps {
  triggerPhase: PawnSkillTriggerPhase;
  chargeBonusPercent?: number;
  kind?: 'charge';
  activationType?: 'single' | 'progressive';
  levels?: readonly { level: number; skillPointCost?: number; requiredInfluencePoints?: number; implicitSkillParams: Readonly<Record<string, number>> }[];
}

export class PawnSkill extends Skill<PawnSkillProps> {
  public constructor(props: PawnSkillProps) { super(props); }

  public get kind(): 'charge' | undefined { return this.props.kind; }
  public get activationType(): 'single' | 'progressive' | undefined { return this.props.activationType; }
  public get levels(): NonNullable<PawnSkillProps['levels']> { return this.props.levels?.map(level => ({ ...level, implicitSkillParams: { ...level.implicitSkillParams } })) ?? []; }
  public get triggerPhase(): PawnSkillTriggerPhase { return this.props.triggerPhase; }
  public get chargeBonusPercent(): number | undefined { return this.props.chargeBonusPercent; }
}

export interface ActivablePlayerSkillProps extends SkillProps {
  activationType?: 'single' | 'progressive';
  levels?: readonly { level: number; skillPointCost: number; requiredInfluencePoints: number; freeWallDestructs?: number; movementCost?: number; freeRecruitThresholdReduction?: number; extraPawnSlots?: number; defensePowerPerLevelBonus?: number; maxDefenseLevelBonus?: number; descriptionKey?: string; descriptionParams?: Readonly<Record<string, string>> }[];
  skillPointCost?: number;
  skillDelay?: number | null;
  requiredInfluencePoints?: number;
  delayIllimited?: boolean;
  freeWallDestructs?: number;
  movementCost?: number;
  extraPawnSlots?: number;
}

export class ActivablePlayerSkill extends Skill<ActivablePlayerSkillProps> {
  public constructor(props: ActivablePlayerSkillProps) { super(props); }

  public get activationType(): 'single' | 'progressive' { return this.props.activationType ?? 'single'; }
  public get levels(): NonNullable<ActivablePlayerSkillProps['levels']> { return this.props.levels?.map(level => ({ ...level })) ?? []; }
  public get skillPointCost(): number | undefined { return this.props.skillPointCost ?? (this.activationType === 'single' ? this.props.levels?.[0]?.skillPointCost : undefined); }
  public get skillDelay(): number | null | undefined { return this.props.skillDelay; }
  public get requiredInfluencePoints(): number | undefined { return this.props.requiredInfluencePoints ?? (this.activationType === 'single' ? this.props.levels?.[0]?.requiredInfluencePoints : undefined); }
  public get delayIllimited(): boolean | undefined { return this.props.delayIllimited; }
  public get freeWallDestructs(): number | undefined { return this.props.freeWallDestructs ?? (this.activationType === 'single' ? this.props.levels?.[0]?.freeWallDestructs : undefined); }
  public get movementCost(): number | undefined { return this.props.movementCost ?? (this.activationType === 'single' ? this.props.levels?.[0]?.movementCost : undefined); }
  public get extraPawnSlots(): number | undefined { return this.props.extraPawnSlots; }
}
