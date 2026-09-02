import type { CommanderCatalogRepository } from '../ports/CommanderCatalogRepository.ts';

export interface CommanderListItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly pawnMax: number;
  readonly health: number;
  readonly maxDefenseLevel: number;
  readonly wallVisualSet: string;
  readonly defensePowerPerLevel: number;
  readonly pawnDefinitionIdByColor: { readonly red: string; readonly blue: string; readonly green: string };
  readonly commanderPawnDefinitionIds: readonly string[];
  readonly officerPawnDefinitionIds: readonly string[];
  readonly movementsPerTurn: number;
  readonly skills?: readonly string[];
  readonly innateSkills?: readonly string[];
  readonly freeRecruitThreshold?: number;
}

export class ListCommanders {
  private readonly commanderCatalog: CommanderCatalogRepository;

  public constructor(commanderCatalog: CommanderCatalogRepository) {
    this.commanderCatalog = commanderCatalog;
  }

  public async execute(): Promise<CommanderListItem[]> {
    const commanders = await this.commanderCatalog.findAll();
    return commanders.map((commander) => {
      const stats = commander.baseStats;
      return {
        id: commander.id,
        name: commander.name,
        description: commander.description,
        icon: commander.icon,
        pawnMax: stats.pawnMax,
        health: stats.health,
        maxDefenseLevel: stats.maxDefenseLevel,
        wallVisualSet: stats.wallVisualSet,
        defensePowerPerLevel: stats.defensePowerPerLevel,
        pawnDefinitionIdByColor: {
          red: stats.pawnDefinitionIdByColor.red.value,
          blue: stats.pawnDefinitionIdByColor.blue.value,
          green: stats.pawnDefinitionIdByColor.green.value,
        },
        commanderPawnDefinitionIds: stats.commanderPawnDefinitionIds.map((id) => id.value),
        officerPawnDefinitionIds: stats.officerPawnDefinitionIds.map((id) => id.value),
        movementsPerTurn: stats.movementsPerTurn,
        skills: stats.skills?.map((id) => id.value),
        innateSkills: stats.innateSkills?.map((id) => id.value),
        freeRecruitThreshold: stats.freeRecruitThreshold,
      };
    });
  }
}
