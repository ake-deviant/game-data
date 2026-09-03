import { readFile } from 'node:fs/promises';
import type { SkillCatalogRepository } from '@game-data/application';
import {
  ActivablePlayerSkill,
  PawnSkill,
  SkillId,
  type Skill,
} from '@game-data/domain';
import { z } from 'zod';

const skillBaseSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  visualKey: z.string().min(1),
});

const documentSchema = z.object({
  pawnSkillVisuals: z.array(skillBaseSchema.extend({
    triggerPhase: z.enum(['spawn', 'decrement', 'movePhase', 'attack']),
    chargeBonusPercent: z.number().optional(),
  })),
  activablePlayerSkills: z.array(skillBaseSchema.extend({
    skillPointCost: z.number(),
    skillDelay: z.number().nullable(),
    requiredInfluencePoints: z.number(),
    delayIllimited: z.boolean().optional(),
    freeWallDestructs: z.number().optional(),
    movementCost: z.number().optional(),
    extraPawnSlots: z.number().optional(),
  })),
});

export class JsonSkillCatalogRepository implements SkillCatalogRepository {
  private readonly catalogPath: string;

  public constructor(catalogPath: string) { this.catalogPath = catalogPath; }

  public async findAll(): Promise<readonly Skill[]> {
    const document = documentSchema.parse(JSON.parse(await readFile(this.catalogPath, 'utf8')));
    return [
      ...document.pawnSkillVisuals.map((skill) => new PawnSkill({
        ...skill,
        id: new SkillId(skill.id),
      })),
      ...document.activablePlayerSkills.map((skill) => new ActivablePlayerSkill({
        ...skill,
        id: new SkillId(skill.id),
      })),
    ];
  }
}
