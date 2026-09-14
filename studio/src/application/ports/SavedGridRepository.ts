import type { SavedGridDocument } from '../models/SavedGridDocument.ts';

export interface SavedGridRepository {
  findAll(): Promise<readonly SavedGridDocument[]>;
  save(grid: SavedGridDocument): Promise<void>;
  delete(id: string): Promise<void>;
}
