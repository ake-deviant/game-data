import { buildPawnSkillsFromParams, type Grid, type PlacedPawn } from '@game-data/domain';
import type { GridDocument, GridPawnDocument } from '../models/GridDocument.ts';
import { GridDocumentValidator } from '../services/GridDocumentValidator.ts';

export class GenerateGridDocument {
  public execute(grid: Grid): GridDocument {
    const document = { rows: 7 as const, cols: 9 as const, pawns: grid.pawns.flatMap((pawn) => this.toPawnDocuments(pawn)) };
    new GridDocumentValidator().validate(document);
    return document;
  }

  private toPawnDocuments(pawn: PlacedPawn): GridPawnDocument[] {
    if (pawn.rank === 'basic-attack') return this.toBasicAttackDocuments(pawn);
    return [this.toPawnDocument(pawn)];
  }

  private toBasicAttackDocuments(pawn: PlacedPawn): GridPawnDocument[] {
    const captainId = pawn.id;
    const col = pawn.position.col;
    const row = pawn.position.row; // anchor = third (top of column)
    const base = { templateId: pawn.templateId, color: pawn.color, type: pawn.type, status: 'attack' as const, rank: 'troop' as const, turnCount: pawn.turnCount, visualKey: pawn.visualKey, weaponKey: pawn.weaponKey, attackGroupId: captainId };
    return [
      { ...base, id: `${captainId}-third`,  pawnRole: 'third',   power: 0,          x: col, y: row },
      { ...base, id: `${captainId}-second`, pawnRole: 'second',  power: 0,          x: col, y: row + 1 },
      { ...base, id: captainId,             pawnRole: 'captain', power: pawn.power, x: col, y: row + 2 },
    ];
  }

  private toPawnDocument(pawn: PlacedPawn): GridPawnDocument {
    const derived = buildPawnSkillsFromParams(pawn.implicitSkillParams);
    const skills = pawn.rank === 'troop' ? undefined : [...(pawn.skills ?? []), ...derived];
    const isDefense = pawn.status === 'defense';
    return {
      id: pawn.id, templateId: pawn.templateId, color: pawn.color, type: pawn.type, status: pawn.status,
      rank: pawn.rank as 'troop' | 'officer' | 'commander', x: pawn.position.col, y: pawn.position.row, power: pawn.power, turnCount: pawn.turnCount,
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
