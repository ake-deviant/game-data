import { readSkillAssignments, writeSkillAssignments } from './SkillAssignmentDocument.ts';
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
    const { skills, innateSkillLevels, maxSkillLevels } = document.baseStats;
    const assignments = readSkillAssignments(skills, innateSkillLevels, maxSkillLevels);
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
        skills: assignments.ids?.map(id => new SkillId(id)),
        innateSkills: document.baseStats.innateSkills?.map((id) => new SkillId(id)),
        innateSkillLevels: assignments.initial,
        maxSkillLevels: assignments.maximum,
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
    const { skills, innateSkills, innateSkillLevels, maxSkillLevels, ...stats } = commander.baseStats;
    const legacyLevels = Object.fromEntries((innateSkills ?? []).map(id => [String(id), 1]));
    const ids = [...new Set([...(skills ?? []), ...(innateSkills ?? [])].map(String))];

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
        skills: writeSkillAssignments(ids, { ...legacyLevels, ...innateSkillLevels }, { ...legacyLevels, ...maxSkillLevels }),
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
