import { GridPosition, type Grid, type PlacedPawn } from '@game-data/domain';

export class MoveGridPawn {
  public execute(grid: Grid, pawnId: string, col: number, row: number): PlacedPawn {
    return grid.move(pawnId, new GridPosition(col, row));
  }
}
