import {
  PawnDefinition,
  PawnDefinitionId,
  PawnIdentity,
  PawnStats,
  PawnVisual,
  SoldierPawnStats,
  WeaponKey,
  type PawnColor,
} from '@game-data/domain';

export class PawnDefinitionFactory {
  public static soldier(id = 'pawn-soldier', color: PawnColor = 'red'): PawnDefinition {
    return new PawnDefinition(
      new PawnIdentity(new PawnDefinitionId(id), color, 'melee'),
      new SoldierPawnStats(8, 2),
      new PawnVisual(`pawn-${color}`, new WeaponKey('sword')),
    );
  }

  public static commander(id = 'pawn-commander'): PawnDefinition {
    return new PawnDefinition(
      new PawnIdentity(new PawnDefinitionId(id), 'red', 'melee', 'Commander pawn'),
      new PawnStats(4, 30, 1, 2),
      new PawnVisual('commander-red', new WeaponKey('sword')),
      10,
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
