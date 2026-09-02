import type { CommanderPawnDefinitionRepository } from '@game-data/application';
import { JsonPawnDefinitionRepository } from './JsonPawnDefinitionCatalogRepository.ts';

export class JsonCommanderPawnDefinitionRepository
  extends JsonPawnDefinitionRepository
  implements CommanderPawnDefinitionRepository {}
