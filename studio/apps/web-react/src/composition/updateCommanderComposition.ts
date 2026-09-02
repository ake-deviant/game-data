import {
  UpdateCommanderController,
  UpdateCommanderPresenter,
} from '@game-data/presentation';
import { HttpUpdateCommander } from '../adapters/HttpUpdateCommander';

export function updateCommanderComposition() {
  const presenter = new UpdateCommanderPresenter();
  const controller = new UpdateCommanderController(
    new HttpUpdateCommander(),
    presenter,
  );
  return { controller, presenter };
}
