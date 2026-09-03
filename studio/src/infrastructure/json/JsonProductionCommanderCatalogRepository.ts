import { readFile } from 'node:fs/promises';
import type {
  ProductionCommanderCatalogRepository,
  ProductionCommanderDocument,
} from '@game-data/application';

export class JsonProductionCommanderCatalogRepository implements ProductionCommanderCatalogRepository {
  private readonly catalogPath: string;

  public constructor(catalogPath: string) { this.catalogPath = catalogPath; }

  public async findAll(): Promise<readonly ProductionCommanderDocument[]> {
    try {
      const document: unknown = JSON.parse(await readFile(this.catalogPath, 'utf8'));
      if (!Array.isArray(document)) throw new Error('Production Commander catalog must be an array.');
      return document as ProductionCommanderDocument[];
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
      throw error;
    }
  }
}
