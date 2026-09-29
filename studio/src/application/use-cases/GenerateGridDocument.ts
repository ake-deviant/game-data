import { buildPawnSkillsFromParams, type Grid, type PlacedPawn } from '@game-data/domain';
import type { GridDocument, GridPawnDocument } from '../models/GridDocument.ts';
import { GridDocumentValidator } from '../services/GridDocumentValidator.ts';

export class GenerateGridDocument {
  public execute(grid: Grid): GridDocument {
    const document = { rows: 7 as const, cols: 9 as const, pawns: grid.pawns.map((pawn) => this.toPawnDocument(pawn)) };
    new GridDocumentValidator().validate(document);
    return document;
  }

  private toPawnDocument(pawn: PlacedPawn): GridPawnDocument {
    const derived = buildPawnSkillsFromParams(pawn.implicitSkillParams);
    const skills = pawn.rank === 'troop' ? undefined : [...(pawn.skills ?? []), ...derived];
    const isDefense = pawn.status === 'defense';
    return {
      id: pawn.id, templateId: pawn.templateId, color: pawn.color, type: pawn.type, status: pawn.status,
      rank: pawn.rank, x: pawn.position.col, y: pawn.position.row, power: pawn.power, turnCount: pawn.turnCount,
      visualKey: pawn.visualKey, weaponKey: pawn.weaponKey,
      ...(isDefense ? {
        defenseLevel: pawn.defenseLevel,
        footprint: pawn.footprint.value,
        occupiedCells: pawn.occupiedCells.map((cell) => ({ col: cell.col, row: cell.row })),
        countPawns: pawn.countPawns,
      } : pawn.rank === 'troop' ? {} : {
        footprint: pawn.footprint.value,
        occupiedCells: pawn.occupiedCells.map((cell) => ({ col: cell.col, row: cell.row })),
        countPawns: pawn.countPawns, moveCount: pawn.moveCount,
        ...(skills && skills.length > 0 ? { skills } : {}),
        ...(pawn.implicitSkillParams ? { implicitSkillParams: pawn.implicitSkillParams } : {}),
      }),
    };
  }
}
