import {
  ActivablePlayerSkill,
  PawnSkill,
  SkillId,
  WallVisualSet,
  WeaponKey,
} from '@game-data/domain';

export class ProductionReferenceCatalogsMother {
  public static valid() {
    return {
      skills: [
        new PawnSkill({
          id: new SkillId('charge-30'),
          displayName: 'Charge 30%',
          displayNameKey: 'skills.charge-30.name',
          descriptionKey: 'skills.charge-30.description',
          descriptionParams: {},
          visualKey: 'charge-30',
          triggerPhase: 'attack',
        }),
        new PawnSkill({
          id: new SkillId('charge-50'),
          displayName: 'Charge 50%',
          displayNameKey: 'skills.charge-50.name',
          descriptionKey: 'skills.charge-50.description',
          descriptionParams: {},
          visualKey: 'charge-50',
          triggerPhase: 'attack',
        }),
        new ActivablePlayerSkill({
          id: new SkillId('tactical-demolition'),
          displayName: 'Tactical demolition',
          displayNameKey: 'skills.tactical-demolition.name',
          descriptionKey: 'skills.tactical-demolition.description',
          descriptionParams: {},
          visualKey: 'tactical-demolition',
          skillPointCost: 25,
          skillDelay: null,
          requiredInfluencePoints: 40,
        }),
      ],
      weaponKeys: [new WeaponKey('sword'), new WeaponKey('arrow')],
      wallVisualSets: [
        new WallVisualSet({ id: 'default', keyByLevel: { '1': 'default-wall' } }),
      ],
    };
  }
}
