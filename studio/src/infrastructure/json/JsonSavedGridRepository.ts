import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SavedGridDocument, SavedGridRepository } from '@game-data/application';

export class JsonSavedGridRepository implements SavedGridRepository {
  private readonly path: string;
  private queue: Promise<void> = Promise.resolve();
  public constructor(path: string) { this.path = path; }

  public async findAll(): Promise<readonly SavedGridDocument[]> {
    await this.queue;
    return this.read();
  }

  public async save(grid: SavedGridDocument): Promise<void> {
    const operation = this.queue.then(async () => {
      const grids = this.read();
      const index = grids.findIndex((item) => item.id === grid.id);
      if (index === -1) grids.push(grid); else grids[index] = grid;
      await this.write(grids);
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  public async delete(id: string): Promise<void> {
    const operation = this.queue.then(async () => this.write(this.read().filter((grid) => grid.id !== id)));
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  private read(): SavedGridDocument[] {
    try {
      const content = readFileSync(this.path, 'utf8');
      const parsed = JSON.parse(content) as unknown;
      if (!Array.isArray(parsed)) throw new Error('Le fichier des grilles doit contenir une liste.');
      return parsed as SavedGridDocument[];
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
      throw error;
    }
  }

  private async write(grids: readonly SavedGridDocument[]): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const temporaryPath = `${this.path}.${randomUUID()}.tmp`;
    try { await writeFile(temporaryPath, `${JSON.stringify(grids, null, 2)}\n`, 'utf8'); await rename(temporaryPath, this.path); }
    catch (error) { await rm(temporaryPath, { force: true }); throw error; }
  }
}
