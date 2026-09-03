import {
  Commander,
  PawnDefinitionId,
  SkillId,
} from '@game-data/domain';
import type { CommanderCatalogRepository } from '../ports/CommanderCatalogRepository.ts';
import type { CreateCommanderRequest } from './CreateCommander.ts';

export class CommanderNotFoundError extends Error {
  public constructor(id: string) {
    super(`Commander '${id}' not found in the internal catalog.`);
    this.name = 'CommanderNotFoundError';
  }
}

export interface UpdateCommanderResult {
  readonly id: string;
  readonly name: string;
}

export class UpdateCommander {
  private readonly commanderCatalog: CommanderCatalogRepository;

  public constructor(commanderCatalog: CommanderCatalogRepository) {
    this.commanderCatalog = commanderCatalog;
  }

  public async execute(request: CreateCommanderRequest): Promise<UpdateCommanderResult> {
    const existing = await this.commanderCatalog.findById(request.id);
    if (!existing) throw new CommanderNotFoundError(request.id);

    const commander = this.buildEntity(request);
    await this.commanderCatalog.save(commander);
    return { id: commander.id, name: commander.name };
  }

  private buildEntity(request: CreateCommanderRequest): Commander {
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
