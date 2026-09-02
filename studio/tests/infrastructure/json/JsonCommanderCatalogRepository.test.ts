import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonCommanderCatalogRepository } from '../../../src/infrastructure/json/JsonCommanderCatalogRepository';
import { CommanderMother } from '../../fixtures/domain/CommanderMother';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('JsonCommanderCatalogRepository', () => {
  it('enregistre et recharge un Commander depuis le catalogue JSON interne', async () => {
    const catalogPath = await createCatalogPath();
    const repository = new JsonCommanderCatalogRepository(catalogPath);

    await repository.save(CommanderMother.valid());
    const restored = await repository.findById('commander-1');

    expect(restored?.name).toBe('Commander');
    expect(restored?.baseStats.pawnDefinitionIdByColor.red.value).toBe('pawn-red');
  });

  it('refuse un catalogue JSON invalide', async () => {
    const catalogPath = await createCatalogPath();
    await writeFile(catalogPath, '[{"id":"incomplete"}]', 'utf8');
    const repository = new JsonCommanderCatalogRepository(catalogPath);

    await expect(repository.findById('incomplete')).rejects.toThrow();
  });

  it('produit un fichier JSON complet après plusieurs sauvegardes simultanées', async () => {
    const catalogPath = await createCatalogPath();
    const repository = new JsonCommanderCatalogRepository(catalogPath);

    await Promise.all([
      repository.save(CommanderMother.withId('commander-1')),
      repository.save(CommanderMother.withId('commander-2')),
    ]);

    const content = JSON.parse(await readFile(catalogPath, 'utf8')) as unknown[];
    expect(content).toHaveLength(2);
  });
});

async function createCatalogPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'game-data-studio-'));
  temporaryDirectories.push(directory);
  return join(directory, 'commanders.json');
}
