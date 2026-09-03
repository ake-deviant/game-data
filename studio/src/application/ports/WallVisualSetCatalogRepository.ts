import type { WallVisualSet } from '@game-data/domain';

export interface WallVisualSetCatalogRepository {
  findAll(): Promise<readonly WallVisualSet[]>;
}
