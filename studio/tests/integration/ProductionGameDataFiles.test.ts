import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { SkillLocalizationValidator } from '../../src/application/services/SkillLocalizationValidator';
import { ProductionGameDataValidator } from '../../src/application/services/ProductionGameDataValidator';
import { JsonProductionCommanderCatalogRepository } from '../../src/infrastructure/json/JsonProductionCommanderCatalogRepository';
import { JsonSkillCatalogRepository } from '../../src/infrastructure/json/JsonSkillCatalogRepository';
import { JsonWallVisualSetCatalogRepository } from '../../src/infrastructure/json/JsonWallVisualSetCatalogRepository';
import { JsonWeaponKeyCatalogRepository } from '../../src/infrastructure/json/JsonWeaponKeyCatalogRepository';

describe('Production game-data files', () => {
  it('valide ensemble tous les fichiers du package', async () => {
    const dataPath = (fileName: string) => fileURLToPath(
      new URL(`../../../data/${fileName}`, import.meta.url),
    );
    const [commanders, skills, weaponKeys, wallVisualSets] = await Promise.all([
      new JsonProductionCommanderCatalogRepository(dataPath('commanders.json')).findAll(),
      new JsonSkillCatalogRepository(dataPath('skills.json')).findAll(),
      new JsonWeaponKeyCatalogRepository(dataPath('weaponKeys.json')).findAll(),
      new JsonWallVisualSetCatalogRepository(dataPath('wallVisualSets.json')).findAll(),
    ]);

    const validate = () => new ProductionGameDataValidator().validate(
      commanders,
      { skills, weaponKeys, wallVisualSets },
    );

    expect(validate).not.toThrow();
    const localeFiles = (await readdir(dataPath('locales'))).filter((file) => file.endsWith('.json'));
    expect(localeFiles).toContain('fr.json');
    for (const file of localeFiles) {
      const catalog = JSON.parse(await readFile(dataPath(`locales/${file}`), 'utf8'));
      new SkillLocalizationValidator().validate(skills, catalog);
    }
  });
});
