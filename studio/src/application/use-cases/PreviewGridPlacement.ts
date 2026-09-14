import { GridPosition, type Grid, type PlacedPawn } from '@game-data/domain';
import type { GridPawnTemplate } from '../ports/GridCatalogReader.ts';
import type { PlaceGridPawn } from './PlaceGridPawn.ts';

export type GridPlacementSource = { readonly template: GridPawnTemplate } | { readonly pawnId: string };
export interface GridPlacementPreview {
  readonly cells: readonly { readonly col: number; readonly row: number }[];
  readonly valid: boolean;
  readonly message?: string;
}

export class PreviewGridPlacement {
  private readonly place: PlaceGridPawn;
  public constructor(place: PlaceGridPawn) { this.place = place; }

  public execute(grid: Grid, source: GridPlacementSource, col: number, row: number): GridPlacementPreview {
    let candidate: PlacedPawn | undefined;
    try {
      const position = new GridPosition(col, row);
      candidate = 'template' in source ? this.place.prepare(source.template, col, row) : grid.find(source.pawnId).at(position);
      if ('template' in source) grid.assertCanPlace(candidate);
      else grid.assertCanMove(source.pawnId, position);
      return { cells: candidate.occupiedCells, valid: true };
    } catch (error) {
      return { cells: candidate?.occupiedCells ?? [], valid: false, message: error instanceof Error ? error.message : 'Placement impossible.' };
    }
  }
}
