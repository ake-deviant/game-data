import type { SavedGridRepository } from '@game-data/application';
import { z } from 'zod';

const saveSchema = z.object({ id: z.string().min(1).optional(), description: z.string().min(1), grid: z.unknown() });
export class SavedGridApiHandler {
  private readonly repository: SavedGridRepository;
  public constructor(repository: SavedGridRepository) { this.repository = repository; }
  public async handleList() { return { status: 200, body: await this.repository.findAll() }; }
  public async handleDelete(id: string) { await this.repository.delete(id); return { status: 204, body: null }; }
  public async handleSave(input: unknown) {
    const parsed = saveSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { error: 'Description et grille requises.' } };
    try {
      const document = parsed.data.grid as any;
      const result = { id: parsed.data.id ?? crypto.randomUUID(), description: parsed.data.description.trim(), commanderId: String(document.commanderId ?? ''), grid: document.grid ?? document, updatedAt: new Date().toISOString() };
      await this.repository.save(result);
      return { status: 200, body: result };
    } catch (error) { return { status: 400, body: { error: error instanceof Error ? error.message : 'Sauvegarde impossible.' } }; }
  }
}
