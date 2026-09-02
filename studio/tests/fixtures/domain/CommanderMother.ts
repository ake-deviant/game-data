import type { Commander } from '@game-data/domain';
import {
  CommanderFactory,
  type CommanderFactoryOptions,
} from './CommanderFactory';

export class CommanderMother {
  public static valid(options: CommanderFactoryOptions = {}): Commander {
    return CommanderFactory.create(options);
  }

  public static withId(id: string): Commander {
    return CommanderFactory.create({ id });
  }
}
