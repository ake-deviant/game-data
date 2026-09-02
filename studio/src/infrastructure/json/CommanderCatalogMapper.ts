import {
  Commander,
  PawnDefinitionId,
  SkillId,
  type PawnColor,
} from '@game-data/domain';
import type { CommanderCatalogItemDocument } from './CommanderCatalogDocument.ts';

const COLORS: readonly PawnColor[] = ['red', 'blue', 'green'];

export class CommanderCatalogMapper {
  public toDomain(document: CommanderCatalogItemDocument): Commander {
    return new Commander({
      id: document.id,
      name: document.name,
      description: document.description,
      icon: document.icon,
      baseStats: {
        ...document.baseStats,
        pawnDefinitionIdByColor: {
          red: new PawnDefinitionId(document.baseStats.pawnDefinitionIdByColor.red),
          blue: new PawnDefinitionId(document.baseStats.pawnDefinitionIdByColor.blue),
          green: new PawnDefinitionId(document.baseStats.pawnDefinitionIdByColor.green),
        },
        commanderPawnDefinitionIds: document.baseStats.commanderPawnDefinitionIds.map(
          (id) => new PawnDefinitionId(id),
        ),
        officerPawnDefinitionIds: document.baseStats.officerPawnDefinitionIds.map(
          (id) => new PawnDefinitionId(id),
        ),
        skills: document.baseStats.skills?.map((id) => new SkillId(id)),
        innateSkills: document.baseStats.innateSkills?.map((id) => new SkillId(id)),
        skillsByColor: document.baseStats.skillsByColor
          ? Object.fromEntries(
              COLORS.flatMap((color) => {
                const ids = document.baseStats.skillsByColor?.[color];
                return ids ? [[color, ids.map((id) => new SkillId(id))]] : [];
              }),
            )
          : undefined,
      },
    });
  }

  public toDocument(commander: Commander): CommanderCatalogItemDocument {
    const stats = commander.baseStats;

    return {
      id: commander.id,
      name: commander.name,
      description: commander.description,
      icon: commander.icon,
      baseStats: {
        ...stats,
        pawnDefinitionIdByColor: {
          red: stats.pawnDefinitionIdByColor.red.value,
          blue: stats.pawnDefinitionIdByColor.blue.value,
          green: stats.pawnDefinitionIdByColor.green.value,
        },
        commanderPawnDefinitionIds: stats.commanderPawnDefinitionIds.map(String),
        officerPawnDefinitionIds: stats.officerPawnDefinitionIds.map(String),
        skills: stats.skills?.map(String),
        innateSkills: stats.innateSkills?.map(String),
        skillsByColor: stats.skillsByColor
          ? Object.fromEntries(
              COLORS.flatMap((color) => {
                const ids = stats.skillsByColor?.[color];
                return ids ? [[color, ids.map(String)]] : [];
              }),
            )
          : undefined,
      },
    };
  }
}
