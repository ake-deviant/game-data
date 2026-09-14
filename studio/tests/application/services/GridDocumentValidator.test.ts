import { describe, expect, it } from 'vitest';
import { GridDocumentValidator, InvalidGridDocumentError, type GridDocument } from '@game-data/application';

const base: GridDocument = { rows: 7, cols: 9, pawns: [
  { id: '00000000-0000-4000-8000-000000000001', templateId: 'soldier', color: 'red', type: 'melee', status: 'none', rank: 'troop', x: 0, y: 0, power: 2, turnCount: null, visualKey: 'v', weaponKey: 'w' },
  { id: '00000000-0000-4000-8000-000000000002', templateId: 'officer', color: 'red', type: 'ranged', status: 'attack', rank: 'officer', x: 2, y: 1, power: 20, turnCount: 3, countPawns: 0, moveCount: 2, footprint: '1x2', occupiedCells: [{ col: 2, row: 1 }, { col: 2, row: 2 }], visualKey: 'v', weaponKey: 'w' },
] };

describe('GridDocumentValidator', () => {
  it('accepte le contrat produit par la génération', () => {
    expect(() => new GridDocumentValidator().validate(base)).not.toThrow();
  });

  it.each([
    ['dimensions', { rows: 6 }],
    ['UUID dupliqué', { pawns: [base.pawns[0], { ...base.pawns[1], id: base.pawns[0].id }] }],
    ['empreinte absente', { pawns: [base.pawns[0], { ...base.pawns[1], footprint: undefined }] }],
    ['case incohérente', { pawns: [base.pawns[0], { ...base.pawns[1], occupiedCells: [{ col: 2, row: 1 }, { col: 3, row: 2 }] }] }],
    ['collision', { pawns: [base.pawns[0], { ...base.pawns[1], occupiedCells: [{ col: 0, row: 0 }, { col: 0, row: 1 }] }] }],
    ['soldat attack', { pawns: [{ ...base.pawns[0], status: 'attack' }] }],
  ] as const)('rejette %s', (_, patch) => {
    expect(() => new GridDocumentValidator().validate({ ...base, ...patch } as GridDocument)).toThrow(InvalidGridDocumentError);
  });
});
