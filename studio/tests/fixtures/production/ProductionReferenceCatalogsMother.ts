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
          visualKey: 'charge-30',
          triggerPhase: 'attack',
        }),
        new PawnSkill({
          id: new SkillId('charge-50'),
          displayName: 'Charge 50%',
          visualKey: 'charge-50',
          triggerPhase: 'attack',
        }),
        new ActivablePlayerSkill({
          id: new SkillId('tactical-demolition'),
          displayName: 'Tactical demolition',
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
