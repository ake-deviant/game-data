import { describe, expect, it } from 'vitest';
import { LoadGridCatalog, SelectGridCommander, type GridCatalog } from '@game-data/application';
import { GridCatalogController, GridCatalogPresenter } from '@game-data/presentation';

const catalog: GridCatalog = {
  commanders: ['a', 'b'].map((id) => ({ id, name: id, pawnMax: id === 'a' ? 10 : 20,
    pawnDefinitionIdByColor: { red: `${id}-red`, green: `${id}-green`, blue: `${id}-blue` },
    officerPawnDefinitionIds: [], commanderPawnDefinitionIds: [],
  })),
  pawns: ['a', 'b'].flatMap((id) => (['red', 'green', 'blue'] as const).map((color) => ({
    id: `${id}-${color}`, displayName: id, role: 'soldier' as const, color, type: 'melee' as const,
    power: 10, nonePower: 1, turnCount: 2, visualKey: 'visual', weaponKey: 'weapon',
  }))),
};

describe('GridCatalogController', () => {
  it('attend un choix puis remplace la palette et la capacité quand le commandant change', async () => {
    const presenter = new GridCatalogPresenter();
    const controller = new GridCatalogController(new LoadGridCatalog({ read: async () => catalog }), new SelectGridCommander(), presenter);
    await controller.load();
    expect(presenter.getViewModel().pawns).toEqual([]);
    controller.select('a');
    expect(presenter.getViewModel().selectedCommander?.pawnMax).toBe(10);
    controller.select('b');
    expect(presenter.getViewModel().pawns.map((p) => p.id)).toEqual(['b-red', 'b-green', 'b-blue']);
    expect(presenter.getViewModel().selectedCommander?.pawnMax).toBe(20);
    controller.select('');
    expect(presenter.getViewModel().selectedCommander).toBeUndefined();
    expect(presenter.getViewModel().pawns).toEqual([]);
  });

  it('permet de réessayer après un échec de chargement', async () => {
    let fail = true;
    const presenter = new GridCatalogPresenter();
    const controller = new GridCatalogController({ execute: async () => {
      if (fail) throw new Error('offline');
      return catalog;
    } }, new SelectGridCommander(), presenter);
    await controller.load();
    expect(presenter.getViewModel().status).toBe('error');
    fail = false;
    await controller.load();
    expect(presenter.getViewModel().status).toBe('ready');
    expect(presenter.getViewModel().message).toBeUndefined();
  });

  it('ignore une ancienne réponse qui arrive après un nouveau chargement', async () => {
    let resolveFirst!: (value: GridCatalog) => void;
    const first = new Promise<GridCatalog>((resolve) => { resolveFirst = resolve; });
    let calls = 0;
    const presenter = new GridCatalogPresenter();
    const controller = new GridCatalogController({ execute: () => ++calls === 1 ? first : Promise.resolve(catalog) }, new SelectGridCommander(), presenter);
    const pending = controller.load();
    await controller.load();
    controller.select('b');
    resolveFirst({ commanders: [], pawns: [] });
    await pending;
    expect(presenter.getViewModel().selectedCommander?.id).toBe('b');
  });
});
