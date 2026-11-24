import type { SkillCatalogRepository } from '../../../src/application/ports/SkillCatalogRepository';
import type { Skill } from '@game-data/domain';

export class InMemorySkillCatalogRepository implements SkillCatalogRepository {
  public constructor(private readonly skills: readonly Skill[]) {}
  public async findAll(): Promise<readonly Skill[]> { return this.skills; }
}
