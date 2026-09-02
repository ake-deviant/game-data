import {
  CommanderAlreadyExistsError,
  CommanderNotFoundError,
  type CreateCommander,
  type CreateCommanderResult,
  type ListCommanders,
  type CommanderListItem,
  type UpdateCommander,
  type UpdateCommanderResult,
} from '@game-data/application';
import { z } from 'zod';

const colorIdsSchema = z.object({
  red: z.string().min(1),
  blue: z.string().min(1),
  green: z.string().min(1),
});

const commanderRequestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  pawnMax: z.number(),
  health: z.number(),
  maxDefenseLevel: z.number(),
  wallVisualSet: z.string().min(1),
  defensePowerPerLevel: z.number(),
  pawnDefinitionIdByColor: colorIdsSchema,
  commanderPawnDefinitionIds: z.array(z.string().min(1)),
  officerPawnDefinitionIds: z.array(z.string().min(1)),
  movementsPerTurn: z.number(),
  skills: z.array(z.string().min(1)).optional(),
  innateSkills: z.array(z.string().min(1)).optional(),
  freeRecruitThreshold: z.number().optional(),
  skillsByColor: z.object({
    red: z.array(z.string().min(1)).optional(),
    blue: z.array(z.string().min(1)).optional(),
    green: z.array(z.string().min(1)).optional(),
  }).optional(),
  powerBonusPerDecrementByColor: z.object({
    red: z.number().optional(),
    blue: z.number().optional(),
    green: z.number().optional(),
  }).optional(),
  movementBonusStrategies: z.object({
    place: z.enum(['after-first-match', '1-match-1-move']).optional(),
    remove: z.enum(['after-first-match', '1-match-1-move']).optional(),
  }).optional(),
});

type CreateCommanderExecutor = Pick<CreateCommander, 'execute'>;
type UpdateCommanderExecutor = Pick<UpdateCommander, 'execute'>;
type ListCommandersExecutor = Pick<ListCommanders, 'execute'>;

export interface ApiResponse {
  readonly status: number;
  readonly body: CreateCommanderResult | UpdateCommanderResult | CommanderListItem[] | { readonly error: string };
}

export class CommanderCatalogApiHandler {
  public constructor(
    private readonly createCommander: CreateCommanderExecutor,
    private readonly updateCommander: UpdateCommanderExecutor,
    private readonly listCommanders: ListCommandersExecutor,
  ) {}

  public async handleCreate(input: unknown): Promise<ApiResponse> {
    const parsed = commanderRequestSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { error: 'Invalid Commander data.' } };

    try {
      const result = await this.createCommander.execute(parsed.data);
      return { status: 201, body: result };
    } catch (error) {
      if (error instanceof CommanderAlreadyExistsError) return { status: 409, body: { error: error.message } };
      return { status: 500, body: { error: 'Commander creation failed.' } };
    }
  }

  public async handleUpdate(input: unknown): Promise<ApiResponse> {
    const parsed = commanderRequestSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { error: 'Invalid Commander data.' } };

    try {
      const result = await this.updateCommander.execute(parsed.data);
      return { status: 200, body: result };
    } catch (error) {
      if (error instanceof CommanderNotFoundError) return { status: 404, body: { error: error.message } };
      return { status: 500, body: { error: 'Commander update failed.' } };
    }
  }

  public async handleList(): Promise<ApiResponse> {
    try {
      const result = await this.listCommanders.execute();
      return { status: 200, body: result };
    } catch {
      return { status: 500, body: { error: 'Failed to list commanders.' } };
    }
  }
}
