import type { GridDocument } from './GridDocument.ts';

export interface SavedGridDocument {
  readonly id: string;
  readonly description: string;
  readonly commanderId: string;
  readonly grid: GridDocument;
  readonly updatedAt: string;
}
