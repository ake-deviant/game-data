import type { Commander } from '@game-data/domain';

export interface CommanderCatalogRepository {
  findById(id: string): Promise<Commander | null>;
  findAll(): Promise<Commander[]>;
  save(commander: Commander): Promise<void>;
}
