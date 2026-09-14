import { describe, expect, it } from 'vitest';
import { CreateGrid, GenerateGridDocument, PlaceGridPawn, type GridCatalog } from '@game-data/application';

const catalog: GridCatalog = {
  commanders: [{ id: 'commander', name: 'Commander', pawnMax: 10,
    pawnDefinitionIdByColor: { red: 'soldier-red', blue: 'soldier-blue', green: 'soldier-green' },
    officerPawnDefinitionIds: ['officer'], commanderPawnDefinitionIds: ['commander-pawn'],
  }],
  pawns: [
    { id: 'soldier-red', displayName: 'Soldat', role: 'soldier', color: 'red', type: 'melee', power: 8, nonePower: 2, turnCount: 3, visualKey: 'soldier-visual', weaponKey: 'club' },
    { id: 'soldier-blue', displayName: 'Bleu', role: 'soldier', color: 'blue', type: 'melee', power: 8, nonePower: 2, turnCount: 3, visualKey: 'blue-visual', weaponKey: 'club' },
    { id: 'soldier-green', displayName: 'Vert', role: 'soldier', color: 'green', type: 'melee', power: 8, nonePower: 2, turnCount: 3, visualKey: 'green-visual', weaponKey: 'club' },
    { id: 'officer', displayName: 'Officier', role: 'officer', color: 'red', type: 'ranged', power: 20, turnCount: 3, countPawns: 0, moveCount: 2, visualKey: 'officer-visual', weaponKey: 'bow', skills: ['charge-30', 'power-growth'], implicitSkillParams: { powerBonusPerDecrement: 5, spGrowthBonus: 0 } },
    { id: 'commander-pawn', displayName: 'Chef', role: 'commander', color: 'blue', type: 'melee', power: 30, turnCount: 4, countPawns: 2, moveCount: 0, visualKey: 'commander-visual', weaponKey: 'sword', implicitSkillParams: { liaisonBonusPercent: 10 } },
  ],
};

describe('GenerateGridDocument', () => {
  it('exporte une liste d’exemplaires, les ancres et les empreintes multi-cellules', () => {
    const grid = new CreateGrid().execute(catalog, 'commander');
    let id = 0;
    const place = new PlaceGridPawn({ generate: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}` });
    place.execute(grid, catalog.pawns[0], 0, 0);
    const officer = place.execute(grid, catalog.pawns[3], 2, 2);
    const command = place.execute(grid, catalog.pawns[4], 6, 4);
    const document = new GenerateGridDocument().execute(grid);
    expect(document.rows).toBe(7);
    expect(document.cols).toBe(9);
    expect(document.pawns).toHaveLength(3);
    expect(document.pawns[0]).toMatchObject({ templateId: 'soldier-red', rank: 'troop', status: 'none', x: 0, y: 0, power: 2, turnCount: null, visualKey: 'soldier-visual', weaponKey: 'club' });
    expect(document.pawns[0]).not.toHaveProperty('footprint');
    expect(document.pawns[0]).not.toHaveProperty('skills');
    expect(document.pawns[1]).toMatchObject({ id: officer.id, templateId: 'officer', rank: 'officer', status: 'attack', x: 2, y: 2, power: 20, turnCount: 3, footprint: '1x2', countPawns: 0, moveCount: 2, skills: ['charge-30', 'power-growth', 'power-growth'], implicitSkillParams: { powerBonusPerDecrement: 5, spGrowthBonus: 0 } });
    expect(document.pawns[1].occupiedCells).toEqual([{ col: 2, row: 2 }, { col: 2, row: 3 }]);
    expect(document.pawns[2]).toMatchObject({ id: command.id, templateId: 'commander-pawn', footprint: '2x2', skills: ['liaison-power-bonus'] });
    expect(document.pawns[2].occupiedCells).toEqual([{ col: 6, row: 4 }, { col: 6, row: 5 }, { col: 7, row: 4 }, { col: 7, row: 5 }]);
    expect(JSON.stringify(document)).not.toContain('pawnRole');
    expect(JSON.stringify(document)).not.toContain('attackGroupId');
  });
});
