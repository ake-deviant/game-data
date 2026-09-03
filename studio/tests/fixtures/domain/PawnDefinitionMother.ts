import type { PawnDefinition } from '@game-data/domain';
import type { PawnColor } from '@game-data/domain';
import { PawnDefinitionFactory } from './PawnDefinitionFactory';

export class PawnDefinitionMother {
  public static soldier(id?: string, color?: PawnColor): PawnDefinition {
    return PawnDefinitionFactory.soldier(id, color);
  }

  public static commander(id?: string): PawnDefinition {
    return PawnDefinitionFactory.commander(id);
  }

  public static officer(id?: string): PawnDefinition {
    return PawnDefinitionFactory.officer(id);
  }
}
