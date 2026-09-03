import { readFile } from 'node:fs/promises';
import type { WallVisualSetCatalogRepository } from '@game-data/application';
import { WallVisualSet } from '@game-data/domain';
import { z } from 'zod';

const documentSchema = z.array(z.object({
  id: z.string().min(1),
  keyByLevel: z.record(z.string(), z.string().min(1)),
}));

export class JsonWallVisualSetCatalogRepository implements WallVisualSetCatalogRepository {
  private readonly catalogPath: string;

  public constructor(catalogPath: string) { this.catalogPath = catalogPath; }

  public async findAll(): Promise<readonly WallVisualSet[]> {
    return documentSchema
      .parse(JSON.parse(await readFile(this.catalogPath, 'utf8')))
      .map((set) => new WallVisualSet(set));
  }
}
