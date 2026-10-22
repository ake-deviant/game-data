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
  displayNameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  descriptionParams: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/), z.string().min(1)),
  visualKey: z.string().min(1),
});

const documentSchema = z.object({
  pawnSkillVisuals: z.array(skillBaseSchema.extend({
    triggerPhase: z.enum(['spawn', 'decrement', 'movePhase', 'attack']),
    chargeBonusPercent: z.number().optional(),
  })),
  activablePlayerSkills: z.array(skillBaseSchema.extend({
    activationType: z.enum(['single', 'progressive']).optional(),
    levels: z.array(z.object({
      level: z.number().int().positive(),
      skillPointCost: z.number().nonnegative(),
      requiredInfluencePoints: z.number().nonnegative(),
      freeRecruitThresholdReduction: z.number().nonnegative().optional(),
      extraPawnSlots: z.number().int().nonnegative().optional(),
    })).min(1).optional(),
    skillPointCost: z.number().nonnegative().optional(),
    skillDelay: z.number().nullable().optional(),
    requiredInfluencePoints: z.number().nonnegative().optional(),
    delayIllimited: z.boolean().optional(),
    freeWallDestructs: z.number().optional(),
    movementCost: z.number().optional(),
    extraPawnSlots: z.number().optional(),
  }).superRefine((skill, ctx) => {
    if (skill.activationType === 'progressive') {
      if (!skill.levels?.length || skill.skillPointCost !== undefined || skill.requiredInfluencePoints !== undefined || skill.delayIllimited !== true) {
        ctx.addIssue({ code: 'custom', message: 'Progressive skills require levels and permanent duration, with costs on levels only' });
      }
      skill.levels?.forEach((level, index) => {
        if (level.level !== index + 1 || (skill.id === 'free-recruits' && level.freeRecruitThresholdReduction === undefined)
          || (skill.id === 'expand-pawn-capacity' && level.extraPawnSlots === undefined)) {
          ctx.addIssue({ code: 'custom', message: 'Invalid skill level', path: ['levels', index] });
        }
      });
    } else if (skill.skillPointCost === undefined || skill.requiredInfluencePoints === undefined || skill.levels !== undefined) {
      ctx.addIssue({ code: 'custom', message: 'Single skills require costs and must not define levels' });
    }
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
