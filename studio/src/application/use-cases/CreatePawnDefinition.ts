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

export interface CreatePawnDefinitionRequest {
  readonly role: 'soldier' | 'officer' | 'commander';
  readonly id: string;
  readonly color: 'red' | 'blue' | 'green';
  readonly type: 'melee' | 'ranged';
  readonly displayName?: string;
  readonly power: number;
  readonly turnCount: number;
  readonly nonePower?: number;
  readonly countPawns?: number;
  readonly moveCount?: number;
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly requiredInfluencePoints?: number;
  readonly skills?: readonly string[];
  readonly implicitSkillParams?: {
    readonly powerBonusPerDecrement?: number;
    readonly columnPowerBonusPerDecrement?: number;
    readonly spBonusPerLiaison?: number;
    readonly spBonusPerAttackPawn?: number;
    readonly freeWallDestructsOnDecrement?: number;
    readonly liaisonBonusPercent?: number;
    readonly spGrowthBonus?: number;
  };
}

export interface CreatePawnDefinitionResult {
  readonly id: string;
}

export class PawnDefinitionAlreadyExistsError extends Error {
  public constructor(id: string) {
    super(`PawnDefinition '${id}' already exists in this catalog.`);
    this.name = 'PawnDefinitionAlreadyExistsError';
  }
}

export class CreatePawnDefinition {
  private readonly repository: PawnDefinitionRepository;

  public constructor(repository: PawnDefinitionRepository) {
    this.repository = repository;
  }

  public async execute(request: CreatePawnDefinitionRequest): Promise<CreatePawnDefinitionResult> {
    const id = new PawnDefinitionId(request.id);
    if (await this.repository.findById(id)) throw new PawnDefinitionAlreadyExistsError(request.id);
    await this.repository.save(this.toEntity(request, id));
    return { id: request.id };
  }

  private toEntity(request: CreatePawnDefinitionRequest, id: PawnDefinitionId): PawnDefinition {
    const identity = new PawnIdentity(id, request.color, request.type, request.displayName || undefined);
    const stats = request.nonePower !== undefined
      ? new SoldierPawnStats(request.power, request.turnCount, request.nonePower)
      : new PawnStats(request.turnCount, request.power, request.countPawns ?? 1, request.moveCount ?? 1);
    const visual = new PawnVisual(request.visualKey, new WeaponKey(request.weaponKey));
    const skills = request.skills?.map((s) => new SkillId(s));
    return new PawnDefinition(identity, stats, visual, request.requiredInfluencePoints, skills, request.implicitSkillParams);
  }
}
