import type { CommanderListItem } from '@game-data/application';

export interface CommanderFormModel {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
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
  readonly freeRecruitThreshold?: number;
  readonly skills?: readonly string[];
  readonly innateSkills?: readonly string[];
}

export function commanderListItemToForm(item: CommanderListItem): CommanderFormModel {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    icon: item.icon ?? '',
    pawnMax: item.pawnMax,
    health: item.health,
    maxDefenseLevel: item.maxDefenseLevel,
    wallVisualSet: item.wallVisualSet,
    defensePowerPerLevel: item.defensePowerPerLevel,
    pawnDefinitionIdByColor: item.pawnDefinitionIdByColor,
    commanderPawnDefinitionIds: item.commanderPawnDefinitionIds,
    officerPawnDefinitionIds: item.officerPawnDefinitionIds,
    movementsPerTurn: item.movementsPerTurn,
    freeRecruitThreshold: item.freeRecruitThreshold,
    skills: item.skills ?? [],
    innateSkills: item.innateSkills ?? [],
  };
}

export function createEmptyCommanderForm(): CommanderFormModel {
  return {
    id: '',
    name: '',
    description: '',
    icon: '',
    pawnMax: 40,
    health: 100,
    maxDefenseLevel: 2,
    wallVisualSet: '',
    defensePowerPerLevel: 6,
    pawnDefinitionIdByColor: { red: '', blue: '', green: '' },
    commanderPawnDefinitionIds: [],
    officerPawnDefinitionIds: [],
    movementsPerTurn: 3,
    skills: [],
    innateSkills: [],
  };
}
