import { GridRuleError } from '../errors/GridRuleError.ts';
import { GridPosition } from './GridPosition.ts';

export type GridPawnRank = 'troop' | 'officer' | 'commander';

export class PawnFootprint {
  public readonly cols: number;
  public readonly rows: number;

  public constructor(rank: GridPawnRank) {
    switch (rank) {
      case 'troop': this.cols = 1; this.rows = 1; break;
      case 'officer': this.cols = 1; this.rows = 2; break;
      case 'commander': this.cols = 2; this.rows = 2; break;
      default: throw new GridRuleError('invalid-rank', 'Ce rang de pion ne peut pas être placé dans la grille.');
    }
    Object.freeze(this);
  }

  public get value(): string { return `${this.cols}x${this.rows}`; }

  public cellsAt(anchor: GridPosition): readonly GridPosition[] {
    const cells: GridPosition[] = [];
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        cells.push(new GridPosition(anchor.col + col, anchor.row + row));
      }
    }
    return cells;
  }
}
