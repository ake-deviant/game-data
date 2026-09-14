import type { SavedGridRepository } from '../ports/SavedGridRepository.ts';

export class ListSavedGrids {
  private readonly repository: SavedGridRepository;
  public constructor(repository: SavedGridRepository) { this.repository = repository; }
  public execute() { return this.repository.findAll(); }
}
