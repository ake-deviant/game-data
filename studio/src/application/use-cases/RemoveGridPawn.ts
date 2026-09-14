import type { Grid } from '@game-data/domain';

export class RemoveGridPawn {
  public execute(grid: Grid, pawnId: string): void {
    grid.remove(pawnId);
  }
}
