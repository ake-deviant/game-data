import type { SavedGridRepository } from '../ports/SavedGridRepository.ts';

export class DeleteSavedGrid {
  private readonly repository: SavedGridRepository;
  public constructor(repository: SavedGridRepository) { this.repository = repository; }
  public execute(id: string) { return this.repository.delete(id); }
}
