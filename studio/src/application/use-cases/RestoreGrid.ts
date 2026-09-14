import { Grid, GridPosition, PawnDefinitionId, PawnIdentity, PlacedPawn } from '@game-data/domain';
import type { GridCatalog, GridCommanderItem, GridPawnTemplate } from '../ports/GridCatalogReader.ts';
import type { SavedGridDocument } from '../models/SavedGridDocument.ts';
import { SelectGridCommander } from './SelectGridCommander.ts';

export class RestoreGrid {
  public execute(catalog: GridCatalog, saved: SavedGridDocument): { commander: GridCommanderItem; grid: Grid } {
    const selection = new SelectGridCommander().execute(catalog, saved.commanderId);
    if (saved.grid.rows !== 7 || saved.grid.cols !== 9) throw new Error('Les dimensions de la grille enregistrée sont invalides.');
    const grid = new Grid(selection.commander);
    for (const pawn of saved.grid.pawns) {
      const template = selection.pawns.find((item) => item.id === pawn.templateId);
      if (!template) throw new Error(`Le modèle '${pawn.templateId}' de la grille est introuvable.`);
      if (pawn.color !== template.color || pawn.type !== template.type) throw new Error(`Le modèle '${pawn.templateId}' ne correspond plus au catalogue.`);
      const placed = new PlacedPawn({
        id: pawn.id,
        identity: new PawnIdentity(new PawnDefinitionId(template.id), template.color, template.type, template.displayName),
        rank: pawn.rank, position: new GridPosition(pawn.x, pawn.y), countPawns: pawn.countPawns, moveCount: pawn.moveCount,
        power: pawn.power, turnCount: pawn.turnCount, visualKey: pawn.visualKey, weaponKey: pawn.weaponKey,
        skills: pawn.skills, implicitSkillParams: pawn.implicitSkillParams,
      });
      grid.place(placed);
    }
    return { commander: selection.commander, grid };
  }
}
