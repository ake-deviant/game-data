import type { Grid } from '@game-data/domain';

export class UpdateGridPawn {
  public execute(grid: Grid, pawnId: string, power: number, turnCount: number | null) {
    return grid.updateValues(pawnId, power, turnCount);
  }
}
