import { describe, expect, it } from 'vitest';
import { PawnDefinitionId } from '../../../src/domain/value-objects/PawnDefinitionId';
import { CommanderMother } from '../../fixtures/domain/CommanderMother';

describe('Commander', () => {
  it('exige un soldier pour chaque couleur', () => {
    expect(() => CommanderMother.valid({
      baseStats: {
        pawnDefinitionIdByColor: {
          red: new PawnDefinitionId('pawn-red'),
          blue: new PawnDefinitionId('pawn-blue'),
          green: undefined as never,
        },
      },
    })).toThrow('green soldier');
  });

  it('protège ses références de pions', () => {
    const commander = CommanderMother.valid({
      baseStats: {
        commanderPawnDefinitionIds: [new PawnDefinitionId('pawn-2')],
      },
    });
    const exposed = commander.baseStats.commanderPawnDefinitionIds as PawnDefinitionId[];

    exposed.push(new PawnDefinitionId('pawn-3'));

    expect(commander.baseStats.commanderPawnDefinitionIds.map(String)).toEqual(['pawn-2']);
  });
});
