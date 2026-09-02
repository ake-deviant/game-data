import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { PawnDefinitionRepository } from '@game-data/application';
import type { PawnDefinition, PawnDefinitionId } from '@game-data/domain';
import {
  pawnDefinitionCatalogDocumentSchema,
  type PawnDefinitionCatalogDocument,
} from './PawnDefinitionCatalogDocument.ts';
import { PawnDefinitionCatalogMapper } from './PawnDefinitionCatalogMapper.ts';

export class JsonPawnDefinitionRepository implements PawnDefinitionRepository {
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly catalogPath: string;
  private readonly mapper: PawnDefinitionCatalogMapper;

  public constructor(
    catalogPath: string,
    mapper = new PawnDefinitionCatalogMapper(),
  ) {
    this.catalogPath = catalogPath;
    this.mapper = mapper;
  }

  public async findAll(): Promise<readonly PawnDefinition[]> {
    await this.writeQueue;
    return (await this.readCatalog()).map((document) => this.mapper.toDomain(document));
  }

  public async findById(id: PawnDefinitionId): Promise<PawnDefinition | null> {
    await this.writeQueue;
    const document = (await this.readCatalog()).find(
      (pawn) => pawn.id === id.value,
    );
    return document ? this.mapper.toDomain(document) : null;
  }

  public async save(pawnDefinition: PawnDefinition): Promise<void> {
    const write = this.writeQueue.then(async () => {
      const documents = await this.readCatalog();
      const nextDocument = this.mapper.toDocument(pawnDefinition);
      const index = documents.findIndex(({ id }) => id === nextDocument.id);

      if (index === -1) documents.push(nextDocument);
      else documents[index] = nextDocument;

      await this.writeCatalog(documents);
    });

    this.writeQueue = write.catch(() => undefined);
    return write;
  }

  private async readCatalog(): Promise<PawnDefinitionCatalogDocument> {
    try {
      const content = await readFile(this.catalogPath, 'utf8');
      return pawnDefinitionCatalogDocumentSchema.parse(JSON.parse(content));
    } catch (error) {
      if (this.isMissingFile(error)) return [];
      throw error;
    }
  }

  private async writeCatalog(documents: PawnDefinitionCatalogDocument): Promise<void> {
    const validatedDocuments = pawnDefinitionCatalogDocumentSchema.parse(documents);
    const temporaryPath = `${this.catalogPath}.${randomUUID()}.tmp`;

    await mkdir(dirname(this.catalogPath), { recursive: true });

    try {
      await writeFile(
        temporaryPath,
        `${JSON.stringify(validatedDocuments, null, 2)}\n`,
        'utf8',
      );
      pawnDefinitionCatalogDocumentSchema.parse(
        JSON.parse(await readFile(temporaryPath, 'utf8')),
      );
      await rename(temporaryPath, this.catalogPath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }

  private isMissingFile(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}
