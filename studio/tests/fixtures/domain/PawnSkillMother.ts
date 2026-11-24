import { PawnSkill, SkillId } from '@game-data/domain';

export class PawnSkillMother {
  public static columnPowerDocument() {
    return {
      id: 'increase-power-column-when-decrementing',
      displayName: 'Column power',
      displayNameKey: 'skills.column-power.name',
      descriptionKey: 'skills.column-power.description',
      descriptionParams: { columnPowerBonusPerDecrement: 'pawn.implicitSkillParams.columnPowerBonusPerDecrement' },
      visualKey: 'column-power',
      triggerPhase: 'decrement' as const,
      activationType: 'progressive' as const,
      levels: [
        { level: 1, skillPointCost: 3, requiredInfluencePoints: 3, implicitSkillParams: { columnPowerBonusPerDecrement: 3 } },
        { level: 2, skillPointCost: 5, requiredInfluencePoints: 12, implicitSkillParams: { columnPowerBonusPerDecrement: 7 } },
        { level: 3, skillPointCost: 15, requiredInfluencePoints: 25, implicitSkillParams: { columnPowerBonusPerDecrement: 12 } },
      ],
    };
  }

  public static columnPower(): PawnSkill {
    const document = this.columnPowerDocument();
    return new PawnSkill({ ...document, id: new SkillId(document.id) });
  }

  public static liaisonWithoutPurchaseDocument() {
    return {
      id: 'increase-SP-by-attack-linked-when-preparing',
      displayName: 'Liaison SP gain',
      displayNameKey: 'skills.liaison-sp.name',
      descriptionKey: 'skills.liaison-sp.description',
      descriptionParams: { spBonusPerLiaison: 'pawn.implicitSkillParams.spBonusPerLiaison' },
      visualKey: 'liaison-sp',
      triggerPhase: 'movePhase',
      levels: [{ level: 1 }],
    };
  }
}
