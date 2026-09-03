import {
  CreatePawnDefinitionController,
  CreatePawnDefinitionPresenter,
} from '@game-data/presentation';
import { HttpCreatePawnDefinition } from '../adapters/HttpCreatePawnDefinition';

export function createPawnComposition() {
  const presenter = new CreatePawnDefinitionPresenter();
  const controller = new CreatePawnDefinitionController(
    new HttpCreatePawnDefinition(),
    presenter,
  );
  return { controller, presenter };
}
