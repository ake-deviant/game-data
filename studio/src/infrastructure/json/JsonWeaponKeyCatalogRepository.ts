import { readFile } from 'node:fs/promises';
import type { WeaponKeyCatalogRepository } from '@game-data/application';
import { WeaponKey } from '@game-data/domain';
import { z } from 'zod';

const documentSchema = z.object({
  melee: z.array(z.string().min(1)),
  ranged: z.array(z.string().min(1)),
});

export class JsonWeaponKeyCatalogRepository implements WeaponKeyCatalogRepository {
  private readonly catalogPath: string;

  public constructor(catalogPath: string) { this.catalogPath = catalogPath; }

  public async findAll(): Promise<readonly WeaponKey[]> {
    const document = documentSchema.parse(JSON.parse(await readFile(this.catalogPath, 'utf8')));
    return [...document.melee, ...document.ranged].map((key) => new WeaponKey(key));
  }
}
