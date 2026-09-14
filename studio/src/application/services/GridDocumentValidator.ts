import type { GridDocument, GridPawnDocument } from '../models/GridDocument.ts';

export class InvalidGridDocumentError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidGridDocumentError';
  }
}

export class GridDocumentValidator {
  public validate(document: GridDocument): void {
    if (document.rows !== 7 || document.cols !== 9) {
      throw new InvalidGridDocumentError('Les dimensions de la grille doivent être 7 × 9.');
    }
    if (!Array.isArray(document.pawns)) {
      throw new InvalidGridDocumentError('La grille doit contenir une liste de pions.');
    }
    const ids = new Set<string>();
    const cells = new Set<string>();
    for (const pawn of document.pawns) {
      this.validatePawn(pawn, ids, cells);
    }
  }

  private validatePawn(pawn: GridPawnDocument, ids: Set<string>, cells: Set<string>): void {
    if (!pawn.id || ids.has(pawn.id)) throw new InvalidGridDocumentError(`UUID de pion dupliqué : ${pawn.id}.`);
    ids.add(pawn.id);
    if (!pawn.templateId || pawn.templateId === pawn.id) throw new InvalidGridDocumentError(`templateId invalide pour ${pawn.id}.`);
    if (!Number.isInteger(pawn.x) || !Number.isInteger(pawn.y) || pawn.x < 0 || pawn.y < 0) {
      throw new InvalidGridDocumentError(`Position invalide pour ${pawn.id}.`);
    }
    if (!Number.isInteger(pawn.power) || pawn.power < 1 || pawn.power > 200) throw new InvalidGridDocumentError(`Puissance invalide pour ${pawn.id}.`);
    if (pawn.turnCount !== null && (!Number.isInteger(pawn.turnCount) || pawn.turnCount < 1 || pawn.turnCount > 9)) {
      throw new InvalidGridDocumentError(`Compteur invalide pour ${pawn.id}.`);
    }
    if (pawn.rank === 'troop') {
      if (pawn.status !== 'none' || pawn.turnCount !== null) throw new InvalidGridDocumentError(`Statut ou compteur invalide pour ${pawn.id}.`);
      if (pawn.x >= 9 || pawn.y >= 7) throw new InvalidGridDocumentError(`Position hors limites pour ${pawn.id}.`);
      return;
    }
    if (pawn.status !== 'attack' || pawn.footprint === undefined || pawn.occupiedCells === undefined) {
      throw new InvalidGridDocumentError(`Empreinte ou statut manquant pour ${pawn.id}.`);
    }
    const expected = pawn.rank === 'officer' ? '1x2' : pawn.rank === 'commander' ? '2x2' : undefined;
    if (expected === undefined || pawn.footprint !== expected || pawn.occupiedCells.length !== (expected === '1x2' ? 2 : 4)) {
      throw new InvalidGridDocumentError(`Empreinte incohérente pour ${pawn.id}.`);
    }
    if (pawn.countPawns !== undefined && (!Number.isFinite(pawn.countPawns) || pawn.countPawns < 0)) {
      throw new InvalidGridDocumentError(`Poids invalide pour ${pawn.id}.`);
    }
    for (const cell of pawn.occupiedCells) {
      if (!Number.isInteger(cell.col) || !Number.isInteger(cell.row) || cell.col < 0 || cell.col >= 9 || cell.row < 0 || cell.row >= 7) {
        throw new InvalidGridDocumentError(`Case occupée hors limites pour ${pawn.id}.`);
      }
      const key = `${cell.col}:${cell.row}`;
      if (cells.has(key)) throw new InvalidGridDocumentError(`Collision dans le document sur ${key}.`);
      cells.add(key);
    }
    const expectedCells = new Set<string>();
    for (let col = pawn.x; col < pawn.x + (expected === '2x2' ? 2 : 1); col++) {
      for (let row = pawn.y; row < pawn.y + 2; row++) expectedCells.add(`${col}:${row}`);
    }
    if (expectedCells.size !== pawn.occupiedCells.length || [...expectedCells].some((cell) => !cells.has(cell))) {
      throw new InvalidGridDocumentError(`Cases occupées incohérentes pour ${pawn.id}.`);
    }
  }
}
