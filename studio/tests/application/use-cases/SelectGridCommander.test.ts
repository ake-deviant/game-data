import { describe, expect, it } from 'vitest';
import { SelectGridCommander, type GridCatalog, type GridPawnTemplate } from '@game-data/application';

const pawn = (id: string, role: GridPawnTemplate['role'], color: GridPawnTemplate['color'] = 'red'): GridPawnTemplate => ({
  id, role, color, displayName: id, type: 'melee', power: 10, turnCount: 2, nonePower: 1,
  visualKey: 'visual', weaponKey: 'weapon',
});
const catalog = (): GridCatalog => ({
  commanders: [{ id: 'a', name: 'A', pawnMax: 12,
    pawnDefinitionIdByColor: { red: 'red', green: 'green', blue: 'blue' },
    officerPawnDefinitionIds: ['officer'], commanderPawnDefinitionIds: ['commander'],
  }],
  pawns: [pawn('red', 'soldier'), pawn('green', 'soldier', 'green'), pawn('blue', 'soldier', 'blue'),
    pawn('officer', 'officer'), pawn('commander', 'commander'), pawn('other', 'soldier'),
    pawn('officer', 'commander'), pawn('red', 'soldier', 'blue')],
});

describe('SelectGridCommander', () => {
  it('retient uniquement les modèles associés avec le bon rôle et la bonne couleur de soldat', () => {
    const source = catalog();
    const result = new SelectGridCommander().execute(source, 'a');
    expect(result.pawns).toEqual(source.pawns.slice(0, 5));
    expect(result.commander.pawnMax).toBe(12);
    expect(source.pawns).toHaveLength(8);
  });

  it('signale les références manquantes au lieu de produire une palette partielle', () => {
    const source = catalog();
    expect(() => new SelectGridCommander().execute({ ...source, pawns: source.pawns.filter((p) => p.role !== 'officer') }, 'a'))
      .toThrow('Modèles de pions introuvables : officer');
  });

  it('refuse un commandant inconnu', () => {
    expect(() => new SelectGridCommander().execute(catalog(), 'unknown')).toThrow('Commandant introuvable');
  });
});
