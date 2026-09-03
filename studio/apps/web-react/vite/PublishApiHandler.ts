import {
  ProductionGameDataValidationError,
  type CreateProductionGameDataProposal,
  type CreateProductionGameDataProposalResult,
} from '@game-data/application';

interface PublishError {
  readonly error: string;
  readonly errors?: readonly string[];
}

export class PublishApiHandler {
  private readonly createProposal: Pick<CreateProductionGameDataProposal, 'execute'>;

  public constructor(createProposal: Pick<CreateProductionGameDataProposal, 'execute'>) {
    this.createProposal = createProposal;
  }

  public async handle(input: unknown): Promise<{
    status: number;
    body: CreateProductionGameDataProposalResult | PublishError;
  }> {
    const commanderIds = this.parseIds(input);
    if (!commanderIds) {
      return {
        status: 400,
        body: { error: 'Le corps doit contenir un tableau commanderIds de chaînes non vides.' },
      };
    }

    try {
      return {
        status: 200,
        body: await this.createProposal.execute({ commanderIds }),
      };
    } catch (error) {
      if (error instanceof ProductionGameDataValidationError) {
        return {
          status: 422,
          body: {
            error: 'Les données de production sont invalides.',
            errors: error.errors,
          },
        };
      }
      if (error instanceof Error && /not found/.test(error.message)) {
        return { status: 404, body: { error: error.message } };
      }
      const detail = error instanceof Error ? ` ${error.message}` : '';
      return {
        status: 500,
        body: { error: `La création de la proposition a échoué.${detail}` },
      };
    }
  }

  private parseIds(input: unknown): string[] | null {
    if (typeof input !== 'object' || input === null) return null;
    const { commanderIds } = input as Record<string, unknown>;
    if (!Array.isArray(commanderIds) || commanderIds.length === 0) return null;
    if (commanderIds.some((id) => typeof id !== 'string' || id.trim().length === 0)) return null;
    return commanderIds as string[];
  }
}
