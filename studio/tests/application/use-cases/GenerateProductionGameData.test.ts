import { describe, expect, it } from 'vitest';
import {
  SkillId,
  type Commander,
  type PawnDefinition,
  type PawnDefinitionId,
  type Skill,
  type WallVisualSet,
  type WeaponKey,
} from '@game-data/domain';
import type { CommanderCatalogRepository } from '../../../src/application/ports/CommanderCatalogRepository';
import type { PawnDefinitionRepository } from '../../../src/application/ports/PawnDefinitionRepository';
import type { SkillCatalogRepository } from '../../../src/application/ports/SkillCatalogRepository';
import type { WallVisualSetCatalogRepository } from '../../../src/application/ports/WallVisualSetCatalogRepository';
import type { WeaponKeyCatalogRepository } from '../../../src/application/ports/WeaponKeyCatalogRepository';
import type { ProductionCommanderCatalogRepository } from '../../../src/application/ports/ProductionCommanderCatalogRepository';
import type { ProductionCommanderDocument } from '../../../src/application/models/ProductionCommanderDocument';
import {
  ProductionGameDataValidationError,
  ProductionGameDataValidator,
} from '../../../src/application/services/ProductionGameDataValidator';
import { GenerateProductionGameData } from '../../../src/application/use-cases/GenerateProductionGameData';
import { CommanderMother } from '../../fixtures/domain/CommanderMother';
import { PawnDefinitionMother } from '../../fixtures/domain/PawnDefinitionMother';
import { ProductionCommanderCatalogMother } from '../../fixtures/production/ProductionCommanderCatalogMother';
import { ProductionReferenceCatalogsMother } from '../../fixtures/production/ProductionReferenceCatalogsMother';

describe('GenerateProductionGameData', () => {
  it('génère les données de production finales pour un Commander valide', async () => {
    // Arrange
    const input = { commanderIds: ['commander-1'] };
    const output = ProductionCommanderCatalogMother.valid();
    const commander = CommanderMother.valid();
    const useCase = createUseCase(commander);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toEqual(output);
  });

  it('retourne toutes les statistiques invalides du Commander', async () => {
    // Arrange
    const commander = CommanderMother.valid({
      baseStats: { pawnMax: -1, health: Number.POSITIVE_INFINITY },
    });
    const useCase = createUseCase(commander);

    // Act
    const execution = useCase.execute({ commanderIds: ['commander-1'] });

    // Assert
    await expect(execution).rejects.toEqual(expect.objectContaining({
      name: 'ProductionGameDataValidationError',
      errors: [
        'commanders[0].baseStats.pawnMax must be a finite non-negative number.',
        'commanders[0].baseStats.health must be a finite non-negative number.',
      ],
    } satisfies Partial<ProductionGameDataValidationError>));
  });

  it('conserve les Commanders déjà présents dans le catalogue de production', async () => {
    // Arrange
    const existing = ProductionCommanderCatalogMother.commanderWithId('commander-existing');
    const useCase = createUseCase(CommanderMother.valid(), [existing]);

    // Act
    const result = await useCase.execute({ commanderIds: ['commander-1'] });

    // Assert
    expect(result).toEqual([
      existing,
      ...ProductionCommanderCatalogMother.valid(),
    ]);
  });

  it('retourne toutes les références de skills inconnues du Commander', async () => {
    // Arrange
    const commander = CommanderMother.valid({
      baseStats: {
        skills: [new SkillId('unknown-skill')],
        innateSkills: [new SkillId('unknown-innate-skill')],
      },
    });
    const useCase = createUseCase(commander);

    // Act
    const execution = useCase.execute({ commanderIds: ['commander-1'] });

    // Assert
    await expect(execution).rejects.toEqual(expect.objectContaining({
      name: 'ProductionGameDataValidationError',
      errors: [
        "Unknown skill id 'unknown-skill'.",
        "Unknown skill id 'unknown-innate-skill'.",
      ],
    } satisfies Partial<ProductionGameDataValidationError>));
  });
});

function createUseCase(
  commander: Commander,
  productionCommanders: readonly ProductionCommanderDocument[] = [],
): GenerateProductionGameData {
  const references = ProductionReferenceCatalogsMother.valid();
  return new GenerateProductionGameData(
    new InMemoryCommanderCatalog([commander]),
    new InMemoryPawnDefinitionRepository([
      PawnDefinitionMother.soldier('pawn-red', 'red'),
      PawnDefinitionMother.soldier('pawn-blue', 'blue'),
      PawnDefinitionMother.soldier('pawn-green', 'green'),
    ]),
    new InMemoryPawnDefinitionRepository([
      PawnDefinitionMother.commander('pawn-commander'),
    ]),
    new InMemoryPawnDefinitionRepository(),
    new InMemoryProductionCommanderCatalogRepository(productionCommanders),
    new InMemorySkillCatalogRepository(references.skills),
    new InMemoryWeaponKeyCatalogRepository(references.weaponKeys),
    new InMemoryWallVisualSetCatalogRepository(references.wallVisualSets),
    new ProductionGameDataValidator(),
  );
}

class InMemoryCommanderCatalog implements CommanderCatalogRepository {
  public constructor(private readonly commanders: readonly Commander[]) {}

  public async findById(id: string): Promise<Commander | null> {
    return this.commanders.find((commander) => commander.id === id) ?? null;
  }

  public async findAll(): Promise<Commander[]> {
    return [...this.commanders];
  }

  public async save(): Promise<void> {}
}

class InMemoryPawnDefinitionRepository implements PawnDefinitionRepository {
  public constructor(private readonly definitions: readonly PawnDefinition[] = []) {}

  public async findAll(): Promise<readonly PawnDefinition[]> {
    return this.definitions;
  }

  public async findById(id: PawnDefinitionId): Promise<PawnDefinition | null> {
    return this.definitions.find((definition) => definition.identity.id.equals(id)) ?? null;
  }

  public async save(): Promise<void> {}
}

class InMemoryProductionCommanderCatalogRepository implements ProductionCommanderCatalogRepository {
  public constructor(private readonly commanders: readonly ProductionCommanderDocument[]) {}
  public async findAll(): Promise<readonly ProductionCommanderDocument[]> { return this.commanders; }
}

class InMemorySkillCatalogRepository implements SkillCatalogRepository {
  public constructor(private readonly skills: readonly Skill[]) {}
  public async findAll(): Promise<readonly Skill[]> { return this.skills; }
}

class InMemoryWeaponKeyCatalogRepository implements WeaponKeyCatalogRepository {
  public constructor(private readonly weaponKeys: readonly WeaponKey[]) {}
  public async findAll(): Promise<readonly WeaponKey[]> { return this.weaponKeys; }
}

class InMemoryWallVisualSetCatalogRepository implements WallVisualSetCatalogRepository {
  public constructor(private readonly sets: readonly WallVisualSet[]) {}
  public async findAll(): Promise<readonly WallVisualSet[]> { return this.sets; }
}
