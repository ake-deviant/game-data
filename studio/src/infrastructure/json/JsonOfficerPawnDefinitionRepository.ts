import type { OfficerPawnDefinitionRepository } from '@game-data/application';
import { JsonPawnDefinitionRepository } from './JsonPawnDefinitionCatalogRepository.ts';

export class JsonOfficerPawnDefinitionRepository
  extends JsonPawnDefinitionRepository
  implements OfficerPawnDefinitionRepository {}
