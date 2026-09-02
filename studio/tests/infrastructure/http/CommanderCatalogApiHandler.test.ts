import { describe, expect, it, vi } from 'vitest';
import { CommanderAlreadyExistsError, CommanderNotFoundError } from '@game-data/application';
import { CommanderCatalogApiHandler } from '../../../apps/web-react/vite/CommanderCatalogApiHandler';

const noopUpdate = { execute: vi.fn() };
const noopList = { execute: vi.fn().mockResolvedValue([]) };

describe('CommanderCatalogApiHandler', () => {
  it('retourne le Commander cree', async () => {
    const createExecute = vi.fn().mockResolvedValue({ id: 'commander-1', name: 'Commander' });
    const handler = new CommanderCatalogApiHandler({ execute: createExecute }, noopUpdate, noopList);

    const response = await handler.handleCreate(createRequest());

    expect(response).toEqual({ status: 201, body: { id: 'commander-1', name: 'Commander' } });
  });

  it('refuse une entree invalide avant le cas usage', async () => {
    const execute = vi.fn();
    const handler = new CommanderCatalogApiHandler({ execute }, noopUpdate, noopList);

    const response = await handler.handleCreate({ id: '' });

    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('retourne un conflit pour un identifiant existant', async () => {
    const handler = new CommanderCatalogApiHandler(
      { execute: vi.fn().mockRejectedValue(new CommanderAlreadyExistsError('commander-1')) },
      noopUpdate,
      noopList,
    );

    expect((await handler.handleCreate(createRequest())).status).toBe(409);
  });

  it('met a jour un Commander existant', async () => {
    const updateExecute = vi.fn().mockResolvedValue({ id: 'commander-1', name: 'Commander' });
    const handler = new CommanderCatalogApiHandler({ execute: vi.fn() }, { execute: updateExecute }, noopList);

    const response = await handler.handleUpdate(createRequest());

    expect(response).toEqual({ status: 200, body: { id: 'commander-1', name: 'Commander' } });
  });

  it('retourne 404 pour un Commander introuvable lors de la mise a jour', async () => {
    const handler = new CommanderCatalogApiHandler(
      { execute: vi.fn() },
      { execute: vi.fn().mockRejectedValue(new CommanderNotFoundError('commander-1')) },
      noopList,
    );

    expect((await handler.handleUpdate(createRequest())).status).toBe(404);
  });
});

function createRequest() {
  return {
    id: 'commander-1',
    name: 'Commander',
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
