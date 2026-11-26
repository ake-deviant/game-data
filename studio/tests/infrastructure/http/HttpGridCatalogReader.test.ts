import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpGridCatalogReader } from '../../../apps/web-react/src/adapters/HttpGridCatalogReader';

afterEach(() => vi.unstubAllGlobals());

describe('HttpGridCatalogReader', () => {
  it('lit les API internes et conserve les paramètres et les coûts nuls', async () => {
    const pawn = { id: 'officer', displayName: 'Officier', role: 'officer', color: 'red', type: 'melee',
      power: 10, turnCount: 2, countPawns: 0, moveCount: 0, visualKey: 'v', weaponKey: 'w',
      skills: ['sp-growth', 'liaison-power-bonus'], innateSkillLevels: { 'sp-growth': 2, 'liaison-power-bonus': 0 },
      implicitSkillParams: { powerBonusPerDecrement: 0 } };
    const catalog = { pawnSkillVisuals: [
      { id: 'sp-growth', activationType: 'progressive', levels: [
        { level: 1, implicitSkillParams: { spGrowthBonus: 1 } },
        { level: 2, implicitSkillParams: { spGrowthBonus: 3 } },
      ] },
      { id: 'liaison-power-bonus', levels: [{ level: 1, implicitSkillParams: { liaisonBonusPercent: 10 } }] },
    ] };
    const wallVisualSets = [{ id: 'default', keyByLevel: { '1': 'default_wall_0', '2': 'default_wall_1' } }];
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/pawns')) return new Response(JSON.stringify([pawn]));
      if (url.endsWith('/wall-visual-sets')) return new Response(JSON.stringify(wallVisualSets));
      if (url.endsWith('/skills')) return new Response(JSON.stringify(catalog));
      return new Response(JSON.stringify([]));
    });
    vi.stubGlobal('fetch', fetchMock);
    expect((await new HttpGridCatalogReader().read()).pawns).toEqual([{
      ...pawn, skills: ['sp-growth'], implicitSkillParams: { powerBonusPerDecrement: 0, spGrowthBonus: 3 },
    }]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/catalog/commanders', '/api/catalog/pawns', '/api/catalog/wall-visual-sets', '/api/catalog/skills']);
  });

  it('rejette une réponse HTTP en échec', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    await expect(new HttpGridCatalogReader().read()).rejects.toThrow('Impossible de charger');
  });

  it('rejette un document mal formé', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'invalid' }))));
    await expect(new HttpGridCatalogReader().read()).rejects.toThrow();
  });
});
