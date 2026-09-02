import {
  PawnDefinition,
  PawnDefinitionId,
  PawnIdentity,
  PawnStats,
  PawnVisual,
  SoldierPawnStats,
  WeaponKey,
} from '@game-data/domain';

export class PawnDefinitionFactory {
  public static soldier(id = 'pawn-soldier'): PawnDefinition {
    return new PawnDefinition(
      new PawnIdentity(new PawnDefinitionId(id), 'red', 'melee'),
      new SoldierPawnStats(8, 2, 3),
      new PawnVisual('pawn-red', new WeaponKey('sword')),
    );
  }

  public static officer(id = 'pawn-officer'): PawnDefinition {
    return new PawnDefinition(
      new PawnIdentity(new PawnDefinitionId(id), 'blue', 'melee', 'Officer'),
      new PawnStats(3, 20, 2, 1),
      new PawnVisual('officer-blue', new WeaponKey('spear')),
      5,
    );
  }
}
