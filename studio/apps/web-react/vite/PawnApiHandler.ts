import {
  CreatePawnDefinition,
  UpdatePawnDefinition,
  PawnDefinitionAlreadyExistsError,
  PawnDefinitionNotFoundError,
  type CreatePawnDefinitionResult,
  type UpdatePawnDefinitionResult,
} from '@game-data/application';
import type { PawnDefinitionRepository } from '@game-data/application';
import { z } from 'zod';

const pawnRequestSchema = z.object({
  role: z.enum(['soldier', 'officer', 'commander']),
  id: z.string().min(1),
  color: z.enum(['red', 'blue', 'green']),
  type: z.enum(['melee', 'ranged']),
  displayName: z.string().optional(),
  power: z.number().nonnegative(),
  turnCount: z.number().nonnegative(),
  countPawns: z.number().nonnegative().optional(),
  moveCount: z.number().nonnegative().optional(),
  visualKey: z.string().min(1),
  weaponKey: z.string().min(1),
  requiredInfluencePoints: z.number().nonnegative().optional(),
  skills: z.array(z.string().min(1)).optional(),
  implicitSkillParams: z.object({
    powerBonusPerDecrement:       z.number().optional(),
    columnPowerBonusPerDecrement: z.number().optional(),
    spBonusPerLiaison:            z.number().optional(),
    spBonusPerAttackPawn:         z.number().optional(),
    freeWallDestructsOnDecrement: z.number().optional(),
    liaisonBonusPercent:          z.number().optional(),
    spGrowthBonus:                z.number().optional(),
  }).optional(),
});

export interface ApiResponse {
  readonly status: number;
  readonly body: CreatePawnDefinitionResult | UpdatePawnDefinitionResult | { readonly error: string };
}

export class PawnApiHandler {
  private readonly createUseCases: Record<'soldier' | 'officer' | 'commander', CreatePawnDefinition>;
  private readonly updateUseCases: Record<'soldier' | 'officer' | 'commander', UpdatePawnDefinition>;

  public constructor(
    soldierRepo: PawnDefinitionRepository,
    officerRepo: PawnDefinitionRepository,
    commanderPawnRepo: PawnDefinitionRepository,
  ) {
    this.createUseCases = {
      soldier:   new CreatePawnDefinition(soldierRepo),
      officer:   new CreatePawnDefinition(officerRepo),
      commander: new CreatePawnDefinition(commanderPawnRepo),
    };
    this.updateUseCases = {
      soldier:   new UpdatePawnDefinition(soldierRepo),
      officer:   new UpdatePawnDefinition(officerRepo),
      commander: new UpdatePawnDefinition(commanderPawnRepo),
    };
  }

  public async handleCreate(input: unknown): Promise<ApiResponse> {
    const parsed = pawnRequestSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { error: 'Invalid pawn data.' } };

    try {
      const result = await this.createUseCases[parsed.data.role].execute(parsed.data);
      return { status: 201, body: result };
    } catch (error) {
      if (error instanceof PawnDefinitionAlreadyExistsError) return { status: 409, body: { error: error.message } };
      return { status: 500, body: { error: 'Pawn creation failed.' } };
    }
  }

  public async handleUpdate(input: unknown): Promise<ApiResponse> {
    const parsed = pawnRequestSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { error: 'Invalid pawn data.' } };

    try {
      const result = await this.updateUseCases[parsed.data.role].execute(parsed.data);
      return { status: 200, body: result };
    } catch (error) {
      if (error instanceof PawnDefinitionNotFoundError) return { status: 404, body: { error: error.message } };
      return { status: 500, body: { error: 'Pawn update failed.' } };
    }
  }
}
