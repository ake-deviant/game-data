import type { SoldierPawnDefinitionRepository } from '@game-data/application';
import { JsonPawnDefinitionRepository } from './JsonPawnDefinitionCatalogRepository.ts';

export class JsonSoldierPawnDefinitionRepository
  extends JsonPawnDefinitionRepository
  implements SoldierPawnDefinitionRepository {
  public constructor(path: string) { super(path); }
}
