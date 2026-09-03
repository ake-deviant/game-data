import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PawnSkill } from '@game-data/domain';
import { JsonSkillCatalogRepository } from '../../../src/infrastructure/json/JsonSkillCatalogRepository';
import { JsonWallVisualSetCatalogRepository } from '../../../src/infrastructure/json/JsonWallVisualSetCatalogRepository';
import { JsonWeaponKeyCatalogRepository } from '../../../src/infrastructure/json/JsonWeaponKeyCatalogRepository';
import { JsonProductionCommanderCatalogRepository } from '../../../src/infrastructure/json/JsonProductionCommanderCatalogRepository';
import { ProductionCommanderCatalogMother } from '../../fixtures/production/ProductionCommanderCatalogMother';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('JSON production reference catalog repositories', () => {
  it('charge le catalogue des skills', async () => {
    const path = await createJsonFile({
      pawnSkillVisuals: [{
        id: 'charge-30',
        displayName: 'Charge 30%',
        visualKey: 'charge-30',
        triggerPhase: 'attack',
        chargeBonusPercent: 30,
      }],
      activablePlayerSkills: [],
    });

    const skills = await new JsonSkillCatalogRepository(path).findAll();

    expect(skills).toHaveLength(1);
    expect(skills[0]).toBeInstanceOf(PawnSkill);
    expect(skills[0].id.value).toBe('charge-30');
  });

  it('charge le catalogue des weapon keys', async () => {
    const path = await createJsonFile({ melee: ['sword'], ranged: ['arrow'] });

    const weaponKeys = await new JsonWeaponKeyCatalogRepository(path).findAll();

    expect(weaponKeys.map(String)).toEqual(['sword', 'arrow']);
  });

  it('charge le catalogue des wall visual sets', async () => {
    const path = await createJsonFile([{
      id: 'default',
      keyByLevel: { '1': 'default-wall' },
    }]);

    const sets = await new JsonWallVisualSetCatalogRepository(path).findAll();

    expect(sets).toHaveLength(1);
    expect(sets[0].id).toBe('default');
  });

  it('charge le catalogue des Commanders de production', async () => {
    const expected = ProductionCommanderCatalogMother.valid();
    const path = await createJsonFile(expected);

    const commanders = await new JsonProductionCommanderCatalogRepository(path).findAll();

    expect(commanders).toEqual(expected);
  });
});

async function createJsonFile(document: unknown): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'production-reference-catalog-'));
  temporaryDirectories.push(directory);
  const path = join(directory, 'catalog.json');
  await writeFile(path, JSON.stringify(document), 'utf8');
  return path;
}
