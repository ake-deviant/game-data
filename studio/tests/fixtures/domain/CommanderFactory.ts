import {
  Commander,
  PawnDefinitionId,
  type CommanderProps,
  type CommanderStats,
} from '@game-data/domain';

export interface CommanderFactoryOptions extends Omit<Partial<CommanderProps>, 'baseStats'> {
  readonly baseStats?: Partial<CommanderStats>;
}

export class CommanderFactory {
  public static create(options: CommanderFactoryOptions = {}): Commander {
    const defaultStats: CommanderStats = {
      pawnMax: 40,
      health: 100,
      maxDefenseLevel: 2,
      wallVisualSet: 'default',
      defensePowerPerLevel: 6,
      pawnDefinitionIdByColor: {
        red: new PawnDefinitionId('pawn-red'),
        blue: new PawnDefinitionId('pawn-blue'),
        green: new PawnDefinitionId('pawn-green'),
      },
      commanderPawnDefinitionIds: [new PawnDefinitionId('pawn-commander')],
      officerPawnDefinitionIds: [],
      movementsPerTurn: 3,
    };

    return new Commander({
      id: options.id ?? 'commander-1',
      name: options.name ?? 'Commander',
      description: options.description,
      icon: options.icon,
      baseStats: {
        ...defaultStats,
        ...options.baseStats,
      },
    });
  }
}
