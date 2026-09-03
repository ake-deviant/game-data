import {
  Commander,
  PawnDefinitionId,
  SkillId,
} from '@game-data/domain';
import type { CommanderCatalogRepository } from '../ports/CommanderCatalogRepository.ts';

export interface CreateCommanderRequest {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly pawnMax: number;
  readonly health: number;
  readonly maxDefenseLevel: number;
  readonly wallVisualSet: string;
  readonly defensePowerPerLevel: number;
  readonly pawnDefinitionIdByColor: {
    readonly red: string;
    readonly blue: string;
    readonly green: string;
  };
  readonly commanderPawnDefinitionIds: readonly string[];
  readonly officerPawnDefinitionIds: readonly string[];
  readonly movementsPerTurn: number;
  readonly skills?: readonly string[];
  readonly innateSkills?: readonly string[];
  readonly freeRecruitThreshold?: number;
  readonly skillsByColor?: Partial<Record<'red' | 'blue' | 'green', readonly string[]>>;
  readonly powerBonusPerDecrementByColor?: Partial<Record<'red' | 'blue' | 'green', number>>;
}

export interface CreateCommanderResult {
  readonly id: string;
  readonly name: string;
}

export class CommanderAlreadyExistsError extends Error {
  public constructor(id: string) {
    super(`Commander '${id}' already exists in the internal catalog.`);
    this.name = 'CommanderAlreadyExistsError';
  }
}

export class CreateCommander {
  private readonly commanderCatalog: CommanderCatalogRepository;

  public constructor(commanderCatalog: CommanderCatalogRepository) {
    this.commanderCatalog = commanderCatalog;
  }

  public async execute(request: CreateCommanderRequest): Promise<CreateCommanderResult> {
    const existingCommander = await this.commanderCatalog.findById(request.id);

    if (existingCommander) {
      throw new CommanderAlreadyExistsError(request.id);
    }

    const commander = this.createEntity(request);
    await this.commanderCatalog.save(commander);
    return { id: commander.id, name: commander.name };
  }

  private createEntity(request: CreateCommanderRequest): Commander {
    const toPawnDefinitionId = (id: string) => new PawnDefinitionId(id);
    const toSkillIds = (ids?: readonly string[]) => ids?.map((id) => new SkillId(id));

    return new Commander({
      id: request.id,
      name: request.name,
      description: request.description,
      icon: request.icon,
      baseStats: {
        pawnMax: request.pawnMax,
        health: request.health,
        maxDefenseLevel: request.maxDefenseLevel,
        wallVisualSet: request.wallVisualSet,
        defensePowerPerLevel: request.defensePowerPerLevel,
        pawnDefinitionIdByColor: {
          red: toPawnDefinitionId(request.pawnDefinitionIdByColor.red),
          blue: toPawnDefinitionId(request.pawnDefinitionIdByColor.blue),
          green: toPawnDefinitionId(request.pawnDefinitionIdByColor.green),
        },
        commanderPawnDefinitionIds: request.commanderPawnDefinitionIds.map(toPawnDefinitionId),
        officerPawnDefinitionIds: request.officerPawnDefinitionIds.map(toPawnDefinitionId),
        movementsPerTurn: request.movementsPerTurn,
        skills: toSkillIds(request.skills),
        innateSkills: toSkillIds(request.innateSkills),
        freeRecruitThreshold: request.freeRecruitThreshold,
        skillsByColor: request.skillsByColor
          ? Object.fromEntries(
              Object.entries(request.skillsByColor).map(([color, ids]) => [
                color,
                toSkillIds(ids),
              ]),
            )
          : undefined,
        powerBonusPerDecrementByColor: request.powerBonusPerDecrementByColor,
      },
    });
  }
}
