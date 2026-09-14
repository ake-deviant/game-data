import { describe, expect, it } from 'vitest';
import {
  Grid, GridPosition, GridRuleError, PawnDefinitionId, PawnIdentity, PlacedPawn,
  type GridPawnRank, type GridRuleCode,
} from '@game-data/domain';

function grid(pawnMax = 20): Grid {
  return new Grid({
    id: 'commander-a', pawnMax,
    pawnDefinitionIdByColor: { red: 'soldier-red', blue: 'soldier-blue', green: 'soldier-green' },
    officerPawnDefinitionIds: ['officer-a', 'officer-b'],
    commanderPawnDefinitionIds: ['commander-a', 'commander-b'],
  });
}

function pawn(sequence: number, rank: GridPawnRank, col: number, row: number, countPawns?: number, templateId?: string): PlacedPawn {
  return new PlacedPawn({
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    identity: new PawnIdentity(new PawnDefinitionId(templateId ?? (rank === 'troop' ? 'soldier-red' : `${rank}-a`)), 'red', 'melee'),
    rank, position: new GridPosition(col, row), countPawns, moveCount: 0, power: 10, turnCount: rank === 'troop' ? null : 2,
    visualKey: 'visual', weaponKey: 'weapon',
  });
}

function expectRule(action: () => unknown, code: GridRuleCode): void {
  expect(action).toThrow(GridRuleError);
  expect(action).toThrow(expect.objectContaining({ code }));
}

describe('Grid placement rules', () => {
  it('crée une grille vide de 7 lignes et 9 colonnes', () => {
    const subject = grid(12);
    expect([subject.rows, subject.cols, subject.commanderId]).toEqual([7, 9, 'commander-a']);
    expect(subject.pawns).toEqual([]);
    expect(subject.remainingCapacity).toBe(12);
  });

  it.each([
    ['troop', 8, 6, [{ col: 8, row: 6 }]],
    ['officer', 8, 5, [{ col: 8, row: 5 }, { col: 8, row: 6 }]],
    ['commander', 7, 5, [{ col: 7, row: 5 }, { col: 7, row: 6 }, { col: 8, row: 5 }, { col: 8, row: 6 }]],
  ] as const)('place un %s au bord et calcule toutes les cases depuis son ancre', (rank, col, row, cells) => {
    const subject = grid();
    const placed = pawn(1, rank, col, row);
    subject.place(placed);
    expect(placed.occupiedCells).toEqual(cells);
    expect(subject.pawns).toHaveLength(1);
  });

  it.each([
    ['troop', 9, 0], ['troop', 0, 7], ['officer', 0, 6], ['officer', 9, 0],
    ['commander', 8, 0], ['commander', 0, 6],
  ] as const)('refuse le débordement %s en (%i,%i) sans consommer de capacité', (rank, col, row) => {
    const subject = grid();
    expectRule(() => subject.place(pawn(1, rank, col, row)), 'out-of-bounds');
    expect(subject.pawns).toEqual([]);
    expect(subject.remainingCapacity).toBe(20);
  });

  it.each([[2, 2], [2, 3], [3, 2], [3, 3]])('détecte une collision sur chaque case du commandant (%i,%i)', (col, row) => {
    const subject = grid();
    subject.place(pawn(1, 'commander', 2, 2));
    expectRule(() => subject.place(pawn(2, 'troop', col, row)), 'collision');
    expect(subject.pawns).toHaveLength(1);
  });

  it('détecte une collision sur la seconde case du pion déposé', () => {
    const subject = grid();
    subject.place(pawn(1, 'troop', 0, 1));
    expectRule(() => subject.place(pawn(2, 'officer', 0, 0)), 'collision');
  });

  it('compte les exemplaires par leur poids, avec 1 par défaut et 0 conservé', () => {
    const subject = grid(4);
    subject.place(pawn(1, 'commander', 0, 0, 3));
    subject.place(pawn(2, 'officer', 3, 0, 0));
    subject.place(pawn(3, 'troop', 8, 6));
    expect(subject.pawns).toHaveLength(3);
    expect(subject.consumedCapacity).toBe(4);
    expect(subject.remainingCapacity).toBe(0);
    expectRule(() => subject.place(pawn(4, 'troop', 8, 5)), 'capacity-exceeded');
    expect(subject.consumedCapacity).toBe(4);
  });

  it.each(['officer', 'commander'] as const)('limite chaque modèle de %s à un exemplaire, sans limiter tout le rang', (rank) => {
    const subject = grid();
    subject.place(pawn(1, rank, 0, 0));
    expectRule(() => subject.place(pawn(2, rank, 3, 0)), 'duplicate-template');
    subject.place(pawn(3, rank, 3, 0, 1, `${rank}-b`));
    expect(subject.pawns).toHaveLength(2);
  });

  it('autorise les trous et conserve trois soldats alignés en none', () => {
    const subject = grid();
    for (let row = 1; row <= 3; row++) subject.place(pawn(row, 'troop', 4, row));
    subject.place(pawn(4, 'troop', 4, 6));
    expect(subject.pawns.map((p) => [p.position.row, p.status])).toEqual([[1, 'none'], [2, 'none'], [3, 'none'], [6, 'none']]);
  });

  it('refuse un UUID dupliqué et un modèle étranger au commandant', () => {
    const subject = grid();
    subject.place(pawn(1, 'troop', 0, 0));
    expectRule(() => subject.place(pawn(1, 'troop', 1, 0)), 'duplicate-id');
    expectRule(() => subject.place(pawn(2, 'troop', 1, 0, 1, 'foreign')), 'unavailable-template');
    expect(subject.pawns).toHaveLength(1);
  });
});

describe('Grid moves and removals', () => {
  it('déplace un pion sur une partie de son ancienne empreinte même à pleine capacité', () => {
    const subject = grid(3);
    const original = pawn(1, 'commander', 0, 0, 3);
    subject.place(original);
    const moved = subject.move(original.id, new GridPosition(1, 0));
    expect(moved.occupiedCells).toEqual([{ col: 1, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 0 }, { col: 2, row: 1 }]);
    expect(moved.id).toBe(original.id);
    expect(moved.templateId).toBe(original.templateId);
    expect(moved.moveCount).toBe(0);
    expect(moved.status).toBe('attack');
    expect(original.position).toEqual({ col: 0, row: 0 });
    expect(subject.remainingCapacity).toBe(0);
    expect(subject.move(moved.id, moved.position).position).toEqual(moved.position);
  });

  it('préserve la position, les autres pions et la capacité après un déplacement refusé', () => {
    const subject = grid();
    const officer = pawn(1, 'officer', 0, 0, 2);
    const soldier = pawn(2, 'troop', 1, 2);
    subject.place(officer);
    subject.place(soldier);
    expectRule(() => subject.move(officer.id, new GridPosition(1, 1)), 'collision');
    expectRule(() => subject.move(officer.id, new GridPosition(0, 6)), 'out-of-bounds');
    expect(subject.pawns).toEqual([officer, soldier]);
    expect(subject.consumedCapacity).toBe(3);
  });

  it('libère toutes les cases et le poids à la suppression sans compacter les autres pions', () => {
    const subject = grid();
    const commander = pawn(1, 'commander', 0, 0, 4);
    const soldier = pawn(2, 'troop', 5, 1);
    subject.place(commander);
    subject.place(soldier);
    subject.remove(commander.id);
    expect(subject.pawns).toEqual([soldier]);
    expect(subject.remainingCapacity).toBe(19);
    subject.place(pawn(3, 'commander', 0, 0, 4));
    expect(subject.pawns).toHaveLength(2);
  });

  it('signale un exemplaire inconnu sans modifier la grille', () => {
    const subject = grid();
    expectRule(() => subject.move('unknown', new GridPosition(0, 0)), 'pawn-not-found');
    expectRule(() => subject.remove('unknown'), 'pawn-not-found');
    expect(subject.pawns).toEqual([]);
  });

  it('ne permet pas de modifier la grille en vidant la liste retournée', () => {
    const subject = grid();
    subject.place(pawn(1, 'troop', 0, 0));
    (subject.pawns as PlacedPawn[]).pop();
    expect(subject.pawns).toHaveLength(1);
    expect(Object.isFrozen(subject.pawns[0])).toBe(true);
    expect(Object.isFrozen(subject.pawns[0].position)).toBe(true);
  });
});

describe('Grid input invariants', () => {
  it('refuse de donner un compteur à un soldat libre', () => {
    expectRule(() => pawn(1, 'troop', 0, 0).withValues(10, 2), 'invalid-turn-count');
  });

  it('préserve position, coûts et identité pendant la personnalisation des valeurs', () => {
    const subject = grid();
    const original = pawn(1, 'officer', 2, 3, 0);
    subject.place(original);
    const updated = subject.updateValues(original.id, 1, 1);
    expect(updated).toMatchObject({ id: original.id, templateId: original.templateId, power: 1, turnCount: 1, countPawns: 0, moveCount: 0, position: original.position });
    expect(original.power).toBe(10);
    expectRule(() => subject.updateValues(original.id, 0, 1), 'invalid-power');
    expect(subject.find(original.id)).toBe(updated);
  });

  it.each([-1, 0.5, NaN, Infinity, 1e100])('refuse une coordonnée invalide %s', (value) => {
    expectRule(() => new GridPosition(value, 0), 'invalid-position');
    expectRule(() => new GridPosition(0, value), 'invalid-position');
  });

  it.each([-1, 0.5, NaN, Infinity])('refuse une capacité maximale invalide %s', (value) => {
    expectRule(() => grid(value), 'invalid-capacity');
  });

  it.each([-1, NaN, Infinity])('refuse un poids invalide %s', (value) => {
    expectRule(() => pawn(1, 'troop', 0, 0, value), 'invalid-capacity');
  });

  it('refuse un identifiant non UUID ou identique au modèle et un rang avancé', () => {
    const valid = pawn(1, 'troop', 0, 0);
    const props = { id: valid.id, identity: new PawnIdentity(new PawnDefinitionId('soldier-red'), 'red', 'melee'), rank: 'troop' as const, position: valid.position, power: 10, turnCount: null, visualKey: 'visual', weaponKey: 'weapon' };
    expectRule(() => new PlacedPawn({ ...props, id: 'not-uuid' }), 'invalid-id');
    expectRule(() => new PlacedPawn({ ...props, identity: new PawnIdentity(new PawnDefinitionId(valid.id), 'red', 'melee') }), 'invalid-id');
    expectRule(() => new PlacedPawn({ ...props, rank: 'general' as GridPawnRank, turnCount: 2 }), 'invalid-rank');
  });
});
