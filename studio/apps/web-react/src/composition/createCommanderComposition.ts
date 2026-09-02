import {
  CreateCommanderController,
  CreateCommanderPresenter,
} from '@game-data/presentation';
import { HttpCreateCommander } from '../adapters/HttpCreateCommander';

export function createCommanderComposition() {
  const presenter = new CreateCommanderPresenter();
  const controller = new CreateCommanderController(
    new HttpCreateCommander(),
    presenter,
  );

  return { controller, presenter };
}
