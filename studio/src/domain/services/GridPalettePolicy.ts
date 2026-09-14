import type { PawnColor } from '../value-objects/PawnIdentity.ts';

export interface GridCommanderSelection {
  readonly pawnDefinitionIdByColor: Readonly<Record<PawnColor, string>>;
  readonly officerPawnDefinitionIds: readonly string[];
  readonly commanderPawnDefinitionIds: readonly string[];
}

export class GridPalettePolicy {
  public allows(commander: GridCommanderSelection, pawn: { id: string; role: string; color: PawnColor }): boolean {
    switch (pawn.role) {
      case 'soldier': return commander.pawnDefinitionIdByColor[pawn.color] === pawn.id;
      case 'officer': return commander.officerPawnDefinitionIds.includes(pawn.id);
      case 'commander': return commander.commanderPawnDefinitionIds.includes(pawn.id);
      default: return false;
    }
  }
}
