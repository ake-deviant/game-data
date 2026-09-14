import type { Grid } from '@game-data/domain';
import type { SavedGridRepository } from '../ports/SavedGridRepository.ts';
import type { GenerateGridDocument } from './GenerateGridDocument.ts';
import type { SavedGridDocument } from '../models/SavedGridDocument.ts';

export interface SaveGridRequest { readonly id?: string; readonly description: string; }

export class SaveGrid {
  private readonly repository: SavedGridRepository;
  private readonly generate: GenerateGridDocument;
  public constructor(repository: SavedGridRepository, generate: GenerateGridDocument) {
    this.repository = repository;
    this.generate = generate;
  }

  public async execute(grid: Grid, request: SaveGridRequest): Promise<SavedGridDocument> {
    const description = request.description.trim();
    if (!description) throw new Error('Une description est requise pour enregistrer la grille.');
    const id = request.id?.trim() || globalThis.crypto.randomUUID();
    const document: SavedGridDocument = {
      id, description, commanderId: grid.commanderId, grid: this.generate.execute(grid), updatedAt: new Date().toISOString(),
    };
    await this.repository.save(document);
    return document;
  }
}
