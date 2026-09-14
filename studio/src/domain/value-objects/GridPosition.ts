import { GridRuleError } from '../errors/GridRuleError.ts';

export class GridPosition {
  public readonly col: number;
  public readonly row: number;

  public constructor(col: number, row: number) {
    if (!Number.isSafeInteger(col) || !Number.isSafeInteger(row) || col < 0 || row < 0) {
      throw new GridRuleError('invalid-position', 'Les coordonnées doivent être des entiers positifs ou nuls.');
    }
    this.col = col;
    this.row = row;
    Object.freeze(this);
  }

  public equals(other: GridPosition): boolean {
    return this.col === other.col && this.row === other.row;
  }
}
