import type { PawnDefinition, PawnDefinitionId } from '@game-data/domain';

export interface PawnDefinitionRepository {
  findAll(): Promise<readonly PawnDefinition[]>;
  findById(id: PawnDefinitionId): Promise<PawnDefinition | null>;
  save(pawnDefinition: PawnDefinition): Promise<void>;
  replace(previousId: PawnDefinitionId, pawnDefinition: PawnDefinition): Promise<void>;
}
