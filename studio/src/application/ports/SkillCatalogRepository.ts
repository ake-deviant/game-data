import type { Skill } from '@game-data/domain';

export interface SkillCatalogRepository {
  findAll(): Promise<readonly Skill[]>;
}
