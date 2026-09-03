import {
  UpdatePawnDefinitionController,
  UpdatePawnDefinitionPresenter,
} from '@game-data/presentation';
import { HttpUpdatePawnDefinition } from '../adapters/HttpUpdatePawnDefinition';

export function updatePawnComposition() {
  const presenter = new UpdatePawnDefinitionPresenter();
  const controller = new UpdatePawnDefinitionController(
    new HttpUpdatePawnDefinition(),
    presenter,
  );
  return { controller, presenter };
}
