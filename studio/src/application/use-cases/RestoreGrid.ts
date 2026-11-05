import { Grid, GridPosition, PawnDefinitionId, PawnIdentity, PlacedPawn } from '@game-data/domain';
import type { PawnColor, PawnType } from '@game-data/domain';
import type { GridCatalog, GridCommanderItem } from '../ports/GridCatalogReader.ts';
import type { GridPawnDocument } from '../models/GridDocument.ts';
import type { SavedGridDocument } from '../models/SavedGridDocument.ts';
import { SelectGridCommander } from './SelectGridCommander.ts';

export class RestoreGrid {
  public execute(catalog: GridCatalog, saved: SavedGridDocument): { commander: GridCommanderItem; grid: Grid } {
    const selection = new SelectGridCommander().execute(catalog, saved.commanderId);
    if (saved.grid.rows !== 7 || saved.grid.cols !== 9) throw new Error('Les dimensions de la grille enregistrée sont invalides.');
    const grid = new Grid(selection.commander);

    const attackGroups = new Map<string, GridPawnDocument[]>();
    const regularPawns: GridPawnDocument[] = [];
    for (const pawn of saved.grid.pawns) {
      if (pawn.attackGroupId) {
        const group = attackGroups.get(pawn.attackGroupId) ?? [];
        group.push(pawn);
        attackGroups.set(pawn.attackGroupId, group);
      } else {
        regularPawns.push(pawn);
      }
    }

    for (const pawn of regularPawns) {
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

    for (const [captainId, members] of attackGroups) {
      const captain = members.find((m) => m.pawnRole === 'captain');
      const third = members.find((m) => m.pawnRole === 'third');
      if (!captain || !third || members.length !== 3) throw new Error(`Groupe d'attaque incomplet pour ${captainId}.`);
      const template = selection.pawns.find((item) => item.id === captain.templateId && item.role === 'basic-attack');
      if (!template) throw new Error(`Modèle basic-attack '${captain.templateId}' introuvable pour le groupe ${captainId}.`);
      const placed = new PlacedPawn({
        id: captainId,
        identity: new PawnIdentity(new PawnDefinitionId(template.id), captain.color as PawnColor, captain.type as PawnType, template.displayName),
        rank: 'basic-attack', position: new GridPosition(third.x, third.y),
        power: captain.power, turnCount: captain.turnCount,
        visualKey: captain.visualKey, weaponKey: captain.weaponKey,
      });
      grid.place(placed);
    }

    return { commander: selection.commander, grid };
  }
}
