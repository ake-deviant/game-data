import { describe, expect, it } from 'vitest';
import {
  PawnStats,
  SoldierPawnStats,
} from '../../../src/domain/value-objects/PawnStats';

describe('PawnStats', () => {
  it('accepte les statistiques positives ou nulles', () => {
    expect(new PawnStats(0, 10, 2, 1).power).toBe(10);
  });

  it('refuse une statistique négative', () => {
    expect(() => new PawnStats(1, -1, 1, 1)).toThrow();
  });

  it('refuse une statistique non finie', () => {
    expect(() => new PawnStats(1, Number.NaN, 1, 1)).toThrow();
  });
});

describe('SoldierPawnStats', () => {
  it('contient uniquement les statistiques présentes pour un pion soldier', () => {
    const stats = new SoldierPawnStats(8, 2);

    expect(stats).toEqual({ power: 8, turnCount: 2, nonePower: 2 });
    expect(stats).not.toHaveProperty('countPawns');
    expect(stats).not.toHaveProperty('moveCount');
  });

  it('refuse une valeur négative', () => {
    expect(() => new SoldierPawnStats(8, -1)).toThrow();
  });
});
