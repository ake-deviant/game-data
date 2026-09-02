import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CommanderCatalogRepository } from '@game-data/application';
import type { Commander } from '@game-data/domain';
import {
  commanderCatalogDocumentSchema,
  type CommanderCatalogDocument,
} from './CommanderCatalogDocument.ts';
import { CommanderCatalogMapper } from './CommanderCatalogMapper.ts';

export class JsonCommanderCatalogRepository implements CommanderCatalogRepository {
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly catalogPath: string;
  private readonly mapper: CommanderCatalogMapper;

  public constructor(
    catalogPath: string,
    mapper = new CommanderCatalogMapper(),
  ) {
    this.catalogPath = catalogPath;
    this.mapper = mapper;
  }

  public async findById(id: string): Promise<Commander | null> {
    await this.writeQueue;
    const documents = await this.readCatalog();
    const document = documents.find((commander) => commander.id === id);
    return document ? this.mapper.toDomain(document) : null;
  }

  public async findAll(): Promise<Commander[]> {
    await this.writeQueue;
    const documents = await this.readCatalog();
    return documents.map((doc) => this.mapper.toDomain(doc));
  }

  public async save(commander: Commander): Promise<void> {
    const write = this.writeQueue.then(async () => {
      const documents = await this.readCatalog();
      const nextDocument = this.mapper.toDocument(commander);
      const index = documents.findIndex(({ id }) => id === commander.id);

      if (index === -1) documents.push(nextDocument);
      else documents[index] = nextDocument;

      await this.writeCatalog(documents);
    });

    this.writeQueue = write.catch(() => undefined);
    return write;
  }

  private async readCatalog(): Promise<CommanderCatalogDocument> {
    try {
      const content = await readFile(this.catalogPath, 'utf8');
      return commanderCatalogDocumentSchema.parse(JSON.parse(content));
    } catch (error) {
      if (this.isMissingFile(error)) return [];
      throw error;
    }
  }

  private async writeCatalog(documents: CommanderCatalogDocument): Promise<void> {
    const validatedDocuments = commanderCatalogDocumentSchema.parse(documents);
    const temporaryPath = `${this.catalogPath}.${randomUUID()}.tmp`;

    await mkdir(dirname(this.catalogPath), { recursive: true });

    try {
      await writeFile(
        temporaryPath,
        `${JSON.stringify(validatedDocuments, null, 2)}\n`,
        'utf8',
      );
      commanderCatalogDocumentSchema.parse(
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
