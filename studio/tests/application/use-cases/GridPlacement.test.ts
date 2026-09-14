import { describe, expect, it } from 'vitest';
import { CreateGrid, PlaceGridPawn, MoveGridPawn, RemoveGridPawn, type GridCatalog } from '@game-data/application';
import { CryptoPlacementIdGenerator } from '../../../src/infrastructure/browser/CryptoPlacementIdGenerator';

function catalog(): GridCatalog {
  return {
    commanders: [{ id: 'a', name: 'A', pawnMax: 5,
      pawnDefinitionIdByColor: { red: 'red', green: 'green', blue: 'blue' },
      officerPawnDefinitionIds: ['officer'], commanderPawnDefinitionIds: [],
    }],
    pawns: [
      ...(['red', 'green', 'blue'] as const).map((color) => ({
        id: color, displayName: color, role: 'soldier' as const, color, type: 'melee' as const,
        power: 10, turnCount: 2, nonePower: 1, visualKey: 'v', weaponKey: 'w',
      })),
      { id: 'officer', displayName: 'Officier', role: 'officer', color: 'red', type: 'ranged',
        power: 20, turnCount: 3, countPawns: 0, moveCount: 0, visualKey: 'v', weaponKey: 'w',
        skills: ['power-growth'], implicitSkillParams: { powerBonusPerDecrement: 5 } },
    ],
  };
}

describe('Grid placement use cases', () => {
  it('crée, place, déplace et supprime des exemplaires sans modifier le catalogue', () => {
    const source = catalog();
    const before = structuredClone(source);
    const grid = new CreateGrid().execute(source, 'a');
    const place = new PlaceGridPawn(new CryptoPlacementIdGenerator());
    const soldier = place.execute(grid, source.pawns[0], 8, 6);
    const secondSoldier = place.execute(grid, source.pawns[0], 8, 5);
    const officer = place.execute(grid, source.pawns[3], 0, 0);
    expect(soldier.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(secondSoldier.id).not.toBe(soldier.id);
    expect(soldier.templateId).toBe('red');
    expect([soldier.rank, soldier.status, soldier.countPawns]).toEqual(['troop', 'none', 1]);
    expect([officer.rank, officer.status, officer.countPawns, officer.moveCount]).toEqual(['officer', 'attack', 0, 0]);
    new MoveGridPawn().execute(grid, officer.id, 2, 3);
    expect(grid.find(officer.id).occupiedCells).toEqual([{ col: 2, row: 3 }, { col: 2, row: 4 }]);
    new RemoveGridPawn().execute(grid, soldier.id);
    expect(grid.remainingCapacity).toBe(4);
    expect(source).toEqual(before);
  });

  it('refuse un modèle étranger, même si le cas d’usage reçoit directement son document', () => {
    const source = catalog();
    const grid = new CreateGrid().execute(source, 'a');
    const place = new PlaceGridPawn(new CryptoPlacementIdGenerator());
    expect(() => place.execute(grid, { ...source.pawns[0], id: 'foreign' }, 0, 0)).toThrow(expect.objectContaining({ code: 'unavailable-template' }));
    expect(grid.pawns).toEqual([]);
  });

  it('protège les placements existants si le générateur renvoie un UUID déjà utilisé', () => {
    const source = catalog();
    const grid = new CreateGrid().execute(source, 'a');
    const place = new PlaceGridPawn({ generate: () => '00000000-0000-4000-8000-000000000001' });
    const first = place.execute(grid, source.pawns[0], 0, 0);
    expect(() => place.execute(grid, source.pawns[0], 1, 0)).toThrow(expect.objectContaining({ code: 'duplicate-id' }));
    expect(grid.pawns).toEqual([first]);
  });

  it('exige un commandant existant et une palette complète à la création', () => {
    const source = catalog();
    expect(() => new CreateGrid().execute(source, 'unknown')).toThrow('Commandant introuvable');
    expect(() => new CreateGrid().execute({ ...source, pawns: [] }, 'a')).toThrow('Modèles de pions introuvables');
  });
});
