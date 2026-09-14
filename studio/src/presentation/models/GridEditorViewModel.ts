import type { PlacedPawn } from '@game-data/domain';
import type { GridPlacementPreview } from '@game-data/application';
import type { SavedGridDocument } from '@game-data/application';

export interface GridEditorViewModel {
  readonly ready: boolean;
  readonly rows: number;
  readonly cols: number;
  readonly pawns: readonly PlacedPawn[];
  readonly remainingCapacity: number;
  readonly pawnMax: number;
  readonly selectedId?: string;
  readonly activeTemplateKey?: string;
  readonly movingId?: string;
  readonly preview?: GridPlacementPreview;
  readonly powerInput: string;
  readonly turnCountInput: string;
  readonly message?: string;
  readonly description: string;
  readonly savedId?: string;
  readonly saving: boolean;
  readonly savedGrids: readonly SavedGridDocument[];
}
