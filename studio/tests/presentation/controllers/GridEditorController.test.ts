import { describe, expect, it } from 'vitest';
import {
  CreateGrid, PlaceGridPawn, MoveGridPawn, RemoveGridPawn, UpdateGridPawn, PreviewGridPlacement,
  type GridCommanderItem, type GridPawnTemplate,
} from '@game-data/application';
import { GridEditorController, GridEditorPresenter } from '@game-data/presentation';

const commander: GridCommanderItem = {
  id: 'a', name: 'A', pawnMax: 5,
  pawnDefinitionIdByColor: { red: 'red', green: 'green', blue: 'blue' },
  officerPawnDefinitionIds: ['officer'], commanderPawnDefinitionIds: ['commander'],
};
const templates: readonly GridPawnTemplate[] = [
  ...(['red', 'green', 'blue'] as const).map((color) => ({
    id: color, displayName: color, role: 'soldier' as const, color, type: 'melee' as const,
    power: 99, turnCount: 8, nonePower: 2, visualKey: 'v', weaponKey: 'w',
  })),
  { id: 'officer', displayName: 'Officier', role: 'officer', color: 'red', type: 'ranged', power: 20, turnCount: 3, countPawns: 2, moveCount: 0, visualKey: 'v', weaponKey: 'w' },
  { id: 'commander', displayName: 'Commandant', role: 'commander', color: 'blue', type: 'melee', power: 30, turnCount: 4, countPawns: 3, moveCount: 2, visualKey: 'v', weaponKey: 'w' },
];

function setup() {
  let sequence = 0;
  const place = new PlaceGridPawn({ generate: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` });
  const presenter = new GridEditorPresenter();
  const editor = new GridEditorController({ create: new CreateGrid(), place, move: new MoveGridPawn(), remove: new RemoveGridPawn(), update: new UpdateGridPawn(), preview: new PreviewGridPlacement(place) }, presenter);
  editor.open(commander, templates);
  return { editor, model: presenter.getViewModel };
}

describe('GridEditorController', () => {
  it('prévisualise toutes les cases sans placer, puis initialise le soldat depuis nonePower', () => {
    const { editor, model } = setup();
    editor.chooseTemplate('soldier:red');
    editor.hover(8, 6);
    expect(model().preview).toEqual({ valid: true, cells: [{ col: 8, row: 6 }] });
    expect(model().pawns).toEqual([]);
    expect(model().remainingCapacity).toBe(5);
    editor.drop(8, 6);
    expect(model().pawns[0]).toMatchObject({ power: 2, turnCount: null, rank: 'troop', status: 'none' });
    expect(model().selectedId).toBe(model().pawns[0].id);
    expect(model().preview).toBeUndefined();
    expect(model().remainingCapacity).toBe(4);
  });

  it('montre l’empreinte complète hors limites et refuse le dépôt sans modifier la grille', () => {
    const { editor, model } = setup();
    editor.chooseTemplate('commander:commander');
    editor.hover(8, 6);
    expect(model().preview?.valid).toBe(false);
    expect(model().preview?.cells).toEqual([{ col: 8, row: 6 }, { col: 8, row: 7 }, { col: 9, row: 6 }, { col: 9, row: 7 }]);
    editor.drop(8, 6);
    expect(model().pawns).toEqual([]);
    expect(model().message).toContain('limites');
  });

  it('préserve les valeurs personnalisées et les coûts lors du déplacement', () => {
    const { editor, model } = setup();
    editor.chooseTemplate('officer:officer'); editor.drop(0, 0);
    expect(model().powerInput).toBe('20');
    expect(model().turnCountInput).toBe('3');
    const id = model().selectedId!;
    editor.editPower('200'); editor.editTurnCount('9'); editor.save();
    editor.beginMove(id); editor.hover(0, 1);
    expect(model().preview?.valid).toBe(true);
    expect(model().pawns[0].position).toEqual({ col: 0, row: 0 });
    editor.drop(0, 1);
    expect(model().pawns[0]).toMatchObject({ id, power: 200, turnCount: 9, countPawns: 2, moveCount: 0, position: { col: 0, row: 1 } });
    expect(model().remainingCapacity).toBe(3);
    expect(templates[3]).toMatchObject({ power: 20, turnCount: 3 });
    editor.remove();
    expect(model().pawns).toEqual([]);
    expect(model().remainingCapacity).toBe(5);
    expect(model().selectedId).toBeUndefined();
  });

  it.each(['', '0', '201', '1.5', 'abc', 'Infinity'])('refuse la puissance invalide %j sans perdre la saisie ni modifier le pion', (value) => {
    const { editor, model } = setup();
    editor.chooseTemplate('soldier:red'); editor.drop(0, 0);
    editor.editPower(value); editor.save();
    expect(model().pawns[0].power).toBe(2);
    expect(model().powerInput).toBe(value);
    expect(model().message).toContain('1 à 200');
  });

  it.each(['', '0', '10', '2.5', 'abc'])('refuse le compteur invalide %j et conserve les valeurs précédentes', (value) => {
    const { editor, model } = setup();
    editor.chooseTemplate('officer:officer'); editor.drop(0, 0);
    editor.editPower('100'); editor.editTurnCount(value); editor.save();
    expect(model().pawns[0]).toMatchObject({ power: 20, turnCount: 3 });
    expect(model().message).toContain('1 à 9');
  });

  it('garde le compteur du soldat nul même si la présentation reçoit une saisie', () => {
    const { editor, model } = setup();
    editor.chooseTemplate('soldier:red'); editor.drop(0, 0);
    editor.editPower('1'); editor.editTurnCount('5'); editor.save();
    expect(model().pawns[0]).toMatchObject({ power: 1, turnCount: null });
  });

  it('signale collisions, unicité et capacité dans l’aperçu', () => {
    const { editor, model } = setup();
    editor.chooseTemplate('commander:commander'); editor.drop(0, 0);
    editor.chooseTemplate('soldier:red'); editor.hover(1, 1);
    expect(model().preview?.message).toContain('occupée');
    editor.chooseTemplate('commander:commander'); editor.hover(4, 0);
    expect(model().preview?.message).toContain('déjà placé');
    editor.chooseTemplate('officer:officer'); editor.drop(4, 0);
    editor.chooseTemplate('soldier:red'); editor.hover(8, 6);
    expect(model().preview?.message).toContain('capacité');
    expect(model().remainingCapacity).toBe(0);
  });

  it('annule un déplacement sans changer la position et conserve les compositions par commandant en mémoire', () => {
    const { editor, model } = setup();
    editor.chooseTemplate('soldier:red'); editor.drop(0, 0);
    const id = model().selectedId!;
    editor.beginMove(id); editor.hover(5, 5); editor.cancel(); editor.drop(5, 5);
    expect(model().pawns[0].position).toEqual({ col: 0, row: 0 });
    editor.open({ ...commander, id: 'b' }, templates);
    expect(model().pawns).toEqual([]);
    editor.open(commander, templates);
    expect(model().pawns[0].id).toBe(id);
    editor.open(undefined, []);
    expect(model().ready).toBe(false);
    expect(model().pawns).toEqual([]);
  });
});
