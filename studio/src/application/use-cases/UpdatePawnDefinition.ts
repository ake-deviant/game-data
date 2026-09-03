import {
  PawnDefinition,
  PawnDefinitionId,
  PawnIdentity,
  PawnStats,
  SoldierPawnStats,
  PawnVisual,
  SkillId,
  WeaponKey,
} from '@game-data/domain';
import type { PawnDefinitionRepository } from '../ports/PawnDefinitionRepository.ts';
import type { CreatePawnDefinitionRequest } from './CreatePawnDefinition.ts';

export interface UpdatePawnDefinitionResult {
  readonly id: string;
}

export class PawnDefinitionNotFoundError extends Error {
  public constructor(id: string) {
    super(`PawnDefinition '${id}' was not found in this catalog.`);
    this.name = 'PawnDefinitionNotFoundError';
  }
}

export class UpdatePawnDefinition {
  private readonly repository: PawnDefinitionRepository;

  public constructor(repository: PawnDefinitionRepository) {
    this.repository = repository;
  }

  public async execute(request: CreatePawnDefinitionRequest): Promise<UpdatePawnDefinitionResult> {
    const id = new PawnDefinitionId(request.id);
    await this.repository.save(this.toEntity(request, id));
    return { id: request.id };
  }

  private toEntity(request: CreatePawnDefinitionRequest, id: PawnDefinitionId): PawnDefinition {
    const identity = new PawnIdentity(id, request.color, request.type, request.displayName || undefined);
    const stats = request.role === 'soldier'
      ? new SoldierPawnStats(request.power, request.turnCount)
      : new PawnStats(request.turnCount, request.power, request.countPawns ?? 1, request.moveCount ?? 1);
    const visual = new PawnVisual(request.visualKey, new WeaponKey(request.weaponKey));
    const skills = request.skills?.map((s) => new SkillId(s));
    return new PawnDefinition(identity, stats, visual, request.requiredInfluencePoints, skills, request.implicitSkillParams);
  }
}
