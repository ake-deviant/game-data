import type { PawnDefinition } from '@game-data/domain';
import { PawnDefinitionFactory } from './PawnDefinitionFactory';

export class PawnDefinitionMother {
  public static soldier(id?: string): PawnDefinition {
    return PawnDefinitionFactory.soldier(id);
  }

  public static officer(id?: string): PawnDefinition {
    return PawnDefinitionFactory.officer(id);
  }
}
