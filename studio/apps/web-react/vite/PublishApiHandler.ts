import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import {
  ProductionGameDataValidationError,
  type GenerateProductionGameData,
} from '@game-data/application';

export interface PublishResult {
  published: { id: string; name: string }[];
}

interface PublishError {
  readonly error: string;
  readonly errors?: readonly string[];
}

export class PublishApiHandler {
  private readonly generateProductionGameData: Pick<GenerateProductionGameData, 'execute'>;
  private readonly productionCatalogPath: string;

  public constructor(
    generateProductionGameData: Pick<GenerateProductionGameData, 'execute'>,
    productionCatalogPath: string,
  ) {
    this.generateProductionGameData = generateProductionGameData;
    this.productionCatalogPath = productionCatalogPath;
  }

  public async handle(input: unknown): Promise<{
    status: number;
    body: PublishResult | PublishError;
  }> {
    const commanderIds = this.parseIds(input);
    if (!commanderIds) {
      return {
        status: 400,
        body: { error: 'Le corps doit contenir un tableau commanderIds de chaînes non vides.' },
      };
    }

    try {
      const catalog = await this.generateProductionGameData.execute({ commanderIds });
      await this.write(catalog);
      const selected = catalog.filter(({ id }) => commanderIds.includes(id));
      return {
        status: 200,
        body: { published: selected.map(({ id, name }) => ({ id, name })) },
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
      return { status: 500, body: { error: 'La publication a échoué.' } };
    }
  }

  private parseIds(input: unknown): string[] | null {
    if (typeof input !== 'object' || input === null) return null;
    const { commanderIds } = input as Record<string, unknown>;
    if (!Array.isArray(commanderIds) || commanderIds.length === 0) return null;
    if (commanderIds.some((id) => typeof id !== 'string' || id.trim().length === 0)) return null;
    return commanderIds as string[];
  }

  private async write(catalog: unknown): Promise<void> {
    const temporaryPath = `${this.productionCatalogPath}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.productionCatalogPath), { recursive: true });
    try {
      await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
      await rename(temporaryPath, this.productionCatalogPath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }
}
