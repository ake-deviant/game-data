import { describe, expect, it } from 'vitest';
import type { CommanderListItem } from '../../../src/application/use-cases/ListCommanders';
import { commanderListItemToForm } from '../../../src/presentation/models/CommanderFormModel';

describe('CommanderFormModel', () => {
  it('préremplit le seuil de recrutement gratuit du commander sélectionné', () => {
    const commander: CommanderListItem = {
      id: 'commander-1',
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
      commanderPawnDefinitionIds: [],
      officerPawnDefinitionIds: [],
      movementsPerTurn: 3,
      freeRecruitThreshold: 20,
    };

    const form = commanderListItemToForm(commander);

    expect(form.freeRecruitThreshold).toBe(20);
  });
});
