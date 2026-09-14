import type { SavedGridDocument, SavedGridRepository } from '@game-data/application';

export class HttpSavedGridRepository implements SavedGridRepository {
  public async findAll(): Promise<readonly SavedGridDocument[]> {
    const response = await fetch('/api/grids');
    if (!response.ok) throw new Error('Impossible de charger les grilles enregistrées.');
    return response.json() as Promise<readonly SavedGridDocument[]>;
  }
  public async save(grid: SavedGridDocument): Promise<void> {
    const response = await fetch('/api/grids', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: grid.id, description: grid.description, grid }) });
    if (!response.ok) throw new Error('Impossible d’enregistrer la grille.');
  }
  public async delete(id: string): Promise<void> {
    const response = await fetch(`/api/grids/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Impossible de supprimer la grille.');
  }
}
