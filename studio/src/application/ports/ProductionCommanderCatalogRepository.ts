import type { ProductionCommanderDocument } from '../models/ProductionCommanderDocument.ts';

export interface ProductionCommanderCatalogRepository {
  findAll(): Promise<readonly ProductionCommanderDocument[]>;
}
