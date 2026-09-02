import type { SkillId } from '../value-objects/SkillId.ts';

export type PawnSkillTriggerPhase =
  | 'spawn'
  | 'decrement'
  | 'movePhase'
  | 'attack';

export interface SkillProps {
  id: SkillId;
  displayName: string;
  visualKey: string;
}

export abstract class Skill<TProps extends SkillProps = SkillProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = props;
  }

  public get id(): SkillId { return this.props.id; }
  public get displayName(): string { return this.props.displayName; }
  public get visualKey(): string { return this.props.visualKey; }
}

export interface PawnSkillProps extends SkillProps {
  triggerPhase: PawnSkillTriggerPhase;
  chargeBonusPercent?: number;
}

export class PawnSkill extends Skill<PawnSkillProps> {
  public constructor(props: PawnSkillProps) { super(props); }

  public get triggerPhase(): PawnSkillTriggerPhase { return this.props.triggerPhase; }
  public get chargeBonusPercent(): number | undefined { return this.props.chargeBonusPercent; }
}

export interface ActivablePlayerSkillProps extends SkillProps {
  skillPointCost: number;
  skillDelay: number | null;
  requiredInfluencePoints: number;
  delayIllimited?: boolean;
  freeWallDestructs?: number;
  movementCost?: number;
  extraPawnSlots?: number;
}

export class ActivablePlayerSkill extends Skill<ActivablePlayerSkillProps> {
  public constructor(props: ActivablePlayerSkillProps) { super(props); }

  public get skillPointCost(): number { return this.props.skillPointCost; }
  public get skillDelay(): number | null { return this.props.skillDelay; }
  public get requiredInfluencePoints(): number { return this.props.requiredInfluencePoints; }
  public get delayIllimited(): boolean | undefined { return this.props.delayIllimited; }
  public get freeWallDestructs(): number | undefined { return this.props.freeWallDestructs; }
  public get movementCost(): number | undefined { return this.props.movementCost; }
  public get extraPawnSlots(): number | undefined { return this.props.extraPawnSlots; }
}
