import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PawnDefinitionId, SoldierPawnStats } from '@game-data/domain';
import { JsonSoldierPawnDefinitionRepository } from '../../../src/infrastructure/json/JsonSoldierPawnDefinitionRepository';
import { JsonOfficerPawnDefinitionRepository } from '../../../src/infrastructure/json/JsonOfficerPawnDefinitionRepository';
import { PawnDefinitionMother } from '../../fixtures/domain/PawnDefinitionMother';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('JsonPawnDefinitionCatalogRepository', () => {
  it('enregistre et recharge un pion soldier', async () => {
    const repository = new JsonSoldierPawnDefinitionRepository(await createCatalogPath());
    await repository.save(PawnDefinitionMother.soldier());

    const restored = await repository.findById(new PawnDefinitionId('pawn-soldier'));

    expect(restored?.stats).toBeInstanceOf(SoldierPawnStats);
  });

  it('sépare les catalogues soldier et officer', async () => {
    const soldierRepository = new JsonSoldierPawnDefinitionRepository(await createCatalogPath());
    const officerRepository = new JsonOfficerPawnDefinitionRepository(await createCatalogPath());
    await soldierRepository.save(PawnDefinitionMother.soldier());
    await officerRepository.save(PawnDefinitionMother.officer());

    await expect(soldierRepository.findAll()).resolves.toHaveLength(1);
    await expect(officerRepository.findAll()).resolves.toHaveLength(1);
  });

  it('refuse un catalogue invalide', async () => {
    const catalogPath = await createCatalogPath();
    await writeFile(catalogPath, '[{"id":"incomplete"}]', 'utf8');

    await expect(
      new JsonSoldierPawnDefinitionRepository(catalogPath).findAll(),
    ).rejects.toThrow();
  });

  it('refuse une définition sans statistiques complètes', async () => {
    const catalogPath = await createCatalogPath();
    await writeFile(catalogPath, JSON.stringify([{
      id: 'invalid',
      color: 'red',
      type: 'melee',
      turnCount: 1,
      power: 1,
      visualKey: 'pawn-red',
      weaponKey: 'sword',
    }]), 'utf8');

    await expect(
      new JsonSoldierPawnDefinitionRepository(catalogPath).findAll(),
    ).rejects.toThrow();
  });
});

async function createCatalogPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'pawn-catalog-'));
  temporaryDirectories.push(directory);
  return join(directory, 'pawnDefinitions.json');
}
