import type { PawnDefinitionRepository } from '@game-data/application';
export type PawnRole = 'soldier' | 'officer' | 'commander';

export interface PawnRepositoryEntry {
  readonly role: PawnRole;
  readonly repository: PawnDefinitionRepository;
}

export class PawnCatalogApiHandler {
  private readonly repositories: readonly PawnRepositoryEntry[];

  public constructor(repositories: readonly PawnRepositoryEntry[]) {
    this.repositories = repositories;
  }

  public async handle() {
    const groups = await Promise.all(this.repositories.map(async ({ role, repository }) => ({
      role,
      pawns: await repository.findAll(),
    })));
    return groups.flatMap(({ role, pawns }) => pawns.map((pawn) => ({
      id: pawn.identity.id.value,
      displayName: pawn.identity.displayName ?? pawn.identity.id.value,
      color: pawn.identity.color,
      type: pawn.identity.type,
      role,
      power: pawn.stats.power,
      turnCount: pawn.stats.turnCount,
      visualKey: pawn.visual.visualKey,
      weaponKey: pawn.visual.weaponKey.value,
    })));
  }
}
