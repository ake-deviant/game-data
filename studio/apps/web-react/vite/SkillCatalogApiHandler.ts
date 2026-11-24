import type { JsonSkillCatalogRepository } from '@game-data/infrastructure';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string().min(1),
  levels: z.array(z.object({
    level: z.number().int().positive(),
    values: z.record(z.string(), z.number().nonnegative().nullable()),
    implicitSkillParams: z.record(z.string(), z.number().nonnegative()),
  })).min(1),
});

export class SkillCatalogApiHandler {
  public constructor(private readonly catalog: Pick<JsonSkillCatalogRepository, 'readDocument' | 'updateLevels'>) {}

  public async handleList() {
    return { status: 200, body: await this.catalog.readDocument() };
  }

  public async handleUpdate(input: unknown) {
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { status: 400, body: { error: 'Invalid skill update.' } };
    try {
      const found = await this.catalog.updateLevels(parsed.data.id, parsed.data.levels);
      if (!found) return { status: 404, body: { error: 'Skill not found.' } };
      return { status: 200, body: await this.catalog.readDocument() };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { status: 422, body: { error: error.issues.map(issue => issue.message).join('\n') } };
      }
      return { status: 422, body: { error: error instanceof Error ? error.message : 'Unable to save the skill.' } };
    }
  }
}
