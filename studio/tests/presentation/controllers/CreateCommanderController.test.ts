import { describe, expect, it, vi } from 'vitest';
import { CreateCommanderController } from '../../../src/presentation/controllers/CreateCommanderController';
import type { CommanderFormModel } from '../../../src/presentation/models/CommanderFormModel';

describe('CreateCommanderController', () => {
  it('transmet le succès du cas d’usage au Presenter', async () => {
    const result = { id: 'commander-1', name: 'Commander' };
    const presenter = createPresenter();
    const execute = vi.fn().mockResolvedValue(result);
    const controller = new CreateCommanderController({
      execute,
    }, presenter);

    await controller.submit(createForm());

    expect(presenter.presentSaving).toHaveBeenCalledOnce();
    expect(presenter.presentSuccess).toHaveBeenCalledWith(result);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'commander-1',
        description: undefined,
      }),
    );
  });

  it('transmet l’erreur du cas d’usage au Presenter sans l’interpréter', async () => {
    const error = new Error('failure');
    const presenter = createPresenter();
    const controller = new CreateCommanderController({
      execute: vi.fn().mockRejectedValue(error),
    }, presenter);

    await controller.submit(createForm());

    expect(presenter.presentError).toHaveBeenCalledWith(error);
  });
});

function createPresenter() {
  return {
    presentSaving: vi.fn(),
    presentSuccess: vi.fn(),
    presentError: vi.fn(),
  };
}

function createForm(): CommanderFormModel {
  return {
    id: 'commander-1',
    name: 'Commander',
    description: '',
    icon: '',
    pawnMax: 40,
    health: 100,
    maxDefenseLevel: 2,
    wallVisualSet: 'default',
    defensePowerPerLevel: 6,
    pawnDefinitionIdByColor: {
      red: 'pawn-red',
      blue: 'pawn-blue',
      green: 'pawn-green',
    },
    commanderPawnDefinitionIds: [],
    officerPawnDefinitionIds: [],
    movementsPerTurn: 3,
  };
}
