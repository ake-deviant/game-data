import { describe, expect, it } from 'vitest';
import { Commander } from '@game-data/domain';
import { CommanderMother } from '../../fixtures/domain/CommanderMother';
import type { CommanderCatalogRepository } from '../../../src/application/ports/CommanderCatalogRepository';
import {
  CommanderAlreadyExistsError,
  CreateCommander,
} from '../../../src/application/use-cases/CreateCommander';

describe('CreateCommander', () => {
  it('enregistre un Commander absent du catalogue interne', async () => {
    const catalog = new InMemoryCommanderCatalog();
    const request = createRequest('commander-1');

    const result = await new CreateCommander(catalog).execute(request);
    const storedCommander = await catalog.findById('commander-1');

    expect(result).toEqual({ id: 'commander-1', name: 'Commander' });
    expect(storedCommander?.baseStats.pawnDefinitionIdByColor.red.toString()).toBe('pawn-red');
    expect(storedCommander?.baseStats.commanderPawnDefinitionIds.map(String)).toEqual(['pawn-2']);
  });

  it('refuse de remplacer un Commander existant', async () => {
    const commander = CommanderMother.withId('commander-1');
    const catalog = new InMemoryCommanderCatalog([commander]);

    await expect(
      new CreateCommander(catalog).execute(createRequest('commander-1')),
    ).rejects.toBeInstanceOf(
      CommanderAlreadyExistsError,
    );
  });
});

class InMemoryCommanderCatalog implements CommanderCatalogRepository {
  private readonly commanders = new Map<string, Commander>();

  public constructor(commanders: readonly Commander[] = []) {
    commanders.forEach((commander) => this.commanders.set(commander.id, commander));
  }

  public async findById(id: string): Promise<Commander | null> {
    return this.commanders.get(id) ?? null;
  }

  public async findAll(): Promise<Commander[]> {
    return [...this.commanders.values()];
  }

  public async save(commander: Commander): Promise<void> {
    this.commanders.set(commander.id, commander);
  }
}

function createRequest(id: string) {
  return {
    id,
    name: 'Commander',
    pawnMax: 40,
    health: 100,
    maxDefenseLevel: 2,
    wallVisualSet: 'default',
    defensePowerPerLevel: 6,
    pawnDefinitionIdByColor: {
      red: 'pawn-red',
      blue: 'pawn-blue',
      green: 'pawn-green',
    },
    commanderPawnDefinitionIds: ['pawn-2'],
    officerPawnDefinitionIds: [],
    movementsPerTurn: 3,
  };
}
