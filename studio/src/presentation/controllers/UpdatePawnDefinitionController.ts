import type { UpdatePawnDefinition, CreatePawnDefinitionRequest, UpdatePawnDefinitionResult } from '@game-data/application';
import type { PawnDefinitionFormModel } from '../models/PawnDefinitionFormModel.ts';

type UpdatePawnDefinitionExecutor = Pick<UpdatePawnDefinition, 'execute'>;
interface UpdatePawnDefinitionOutputPresenter {
  presentSaving(): void;
  presentSuccess(result: UpdatePawnDefinitionResult): void;
  presentError(error: unknown): void;
}

export class UpdatePawnDefinitionController {
  public constructor(
    private readonly updatePawnDefinition: UpdatePawnDefinitionExecutor,
    private readonly presenter: UpdatePawnDefinitionOutputPresenter,
  ) {}

  public async submit(form: PawnDefinitionFormModel): Promise<void> {
    this.presenter.presentSaving();
    try {
      const result = await this.updatePawnDefinition.execute(this.toRequest(form));
      this.presenter.presentSuccess(result);
    } catch (error) {
      this.presenter.presentError(error);
    }
  }

  private toRequest(form: PawnDefinitionFormModel): CreatePawnDefinitionRequest {
    const isSoldier = form.role === 'soldier';
    return {
      role: form.role,
      id: form.id,
      color: form.color,
      type: form.type,
      displayName: form.displayName || undefined,
      power: form.power,
      turnCount: form.turnCount,
      ...(!isSoldier && {
            countPawns: form.countPawns,
            moveCount: form.moveCount,
            requiredInfluencePoints: form.requiredInfluencePoints > 0 ? form.requiredInfluencePoints : undefined,
            skills: form.skills.length > 0 ? form.skills : undefined,
            implicitSkillParams: this.toImplicitSkillParams(form),
          }),
      visualKey: form.visualKey,
      weaponKey: form.weaponKey,
    };
  }

  private toImplicitSkillParams(form: PawnDefinitionFormModel): CreatePawnDefinitionRequest['implicitSkillParams'] {
    const p = form.implicitSkillParams;
    const toNum = (v: string) => v !== '' ? Number(v) : undefined;
    const params = {
      powerBonusPerDecrement:        toNum(p.powerBonusPerDecrement),
      columnPowerBonusPerDecrement:  toNum(p.columnPowerBonusPerDecrement),
      spBonusPerLiaison:             toNum(p.spBonusPerLiaison),
      spBonusPerAttackPawn:          toNum(p.spBonusPerAttackPawn),
      freeWallDestructsOnDecrement:  toNum(p.freeWallDestructsOnDecrement),
      liaisonBonusPercent:           toNum(p.liaisonBonusPercent),
      spGrowthBonus:                 toNum(p.spGrowthBonus),
    };
    const hasAny = Object.values(params).some((v) => v !== undefined);
    return hasAny ? params : undefined;
  }
}
