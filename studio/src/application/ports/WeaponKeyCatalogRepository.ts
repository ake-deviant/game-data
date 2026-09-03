import type { WeaponKey } from '@game-data/domain';

export interface WeaponKeyCatalogRepository {
  findAll(): Promise<readonly WeaponKey[]>;
}
