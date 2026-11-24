import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
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
    activationType: z.literal('progressive').optional(),
    levels: z.array(z.object({
      level: z.number().int().positive(), skillPointCost: z.number().nonnegative().optional(), requiredInfluencePoints: z.number().nonnegative().optional(),
      implicitSkillParams: z.object({
        powerBonusPerDecrement: z.number().nonnegative().optional(),
        columnPowerBonusPerDecrement: z.number().nonnegative().optional(),
        spBonusPerLiaison: z.number().nonnegative().optional(),
        spBonusPerAttackPawn: z.number().nonnegative().optional(),
        freeWallDestructsOnDecrement: z.number().nonnegative().optional(),
        liaisonBonusPercent: z.number().nonnegative().optional(),
        spGrowthBonus: z.number().nonnegative().optional(),
        frontlineDamageAbsorptionPercent: z.number().positive().max(100).optional(),
      }).strict().optional().transform(params => params ?? {}),
    })).min(1).optional(),
  }).superRefine((skill, ctx) => {
    if ((skill.activationType === 'progressive' && !skill.levels?.length)
      || (skill.activationType !== 'progressive' && skill.levels !== undefined && skill.levels.length !== 1)
      || skill.levels?.some((level, index) => level.level !== index + 1
        || ((level.skillPointCost === undefined) !== (level.requiredInfluencePoints === undefined))
        || (skill.activationType === 'progressive' && (level.skillPointCost === undefined || !Object.keys(level.implicitSkillParams).length)))) {
      ctx.addIssue({ code: 'custom', message: 'Invalid pawn skill progression' });
    }
  })),
  activablePlayerSkills: z.array(skillBaseSchema.extend({
    activationType: z.enum(['single', 'progressive']).optional(),
    levels: z.array(z.object({
      level: z.number().int().positive(),
      skillPointCost: z.number().nonnegative(),
      requiredInfluencePoints: z.number().nonnegative(),
      freeRecruitThresholdReduction: z.number().nonnegative().optional(),
      extraPawnSlots: z.number().int().nonnegative().optional(),
      freeWallDestructs: z.number().int().nonnegative().optional(),
      movementCost: z.number().int().nonnegative().optional(),
      defensePowerPerLevelBonus: z.number().int().nonnegative().optional(),
      maxDefenseLevelBonus: z.number().int().nonnegative().optional(),
      descriptionKey: z.string().min(1).optional(),
      descriptionParams: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/), z.string().min(1)).optional(),
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
        if (skill.id === 'defense-upgrade' && (level.defensePowerPerLevelBonus ?? 0) + (level.maxDefenseLevelBonus ?? 0) <= 0) {
          ctx.addIssue({ code: 'custom', message: 'Defense upgrade requires a positive bonus', path: ['levels', index] });
        }
        if (level.level !== index + 1 || (skill.id === 'free-recruits' && level.freeRecruitThresholdReduction === undefined)
          || (skill.id === 'expand-pawn-capacity' && level.extraPawnSlots === undefined)) {
          ctx.addIssue({ code: 'custom', message: 'Invalid skill level', path: ['levels', index] });
        }
      });
    } else if (skill.levels ? skill.levels.length !== 1 || skill.levels[0].level !== 1
      : skill.skillPointCost === undefined || skill.requiredInfluencePoints === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Single skills require one level with costs' });
    }
  })),
});

interface SkillLevelUpdate {
  level: number;
  values: Readonly<Record<string, number | null>>;
  implicitSkillParams: Readonly<Record<string, number>>;
}

export class JsonSkillCatalogRepository implements SkillCatalogRepository {
  private readonly catalogPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(catalogPath: string) { this.catalogPath = catalogPath; }

  public async readDocument(): Promise<z.infer<typeof documentSchema>> {
    await this.writeQueue;
    return documentSchema.parse(JSON.parse(await readFile(this.catalogPath, 'utf8')));
  }

  public updateLevels(id: string, updates: readonly SkillLevelUpdate[]): Promise<boolean> {
    const write = this.writeQueue.then(async () => {
      const raw = JSON.parse(await readFile(this.catalogPath, 'utf8'));
      const document = documentSchema.parse(raw);
      const group = document.pawnSkillVisuals.some(skill => skill.id === id)
        ? 'pawnSkillVisuals' : 'activablePlayerSkills';
      const index = document[group].findIndex(skill => skill.id === id);
      if (index < 0) return false;
      const skill = raw[group][index];
      const levels = skill.levels as Record<string, unknown>[] | undefined;
      if (!levels || updates.length !== levels.length) throw new Error('The skill levels have changed. Reload the catalog.');
      const seen = new Set<number>();
      for (const update of updates) {
        const level = levels.find(level => level['level'] === update.level);
        if (!level || seen.has(update.level)) throw new Error('Unknown or duplicate skill level.');
        seen.add(update.level);
        this.updateNumbers(level, update.values, ['skillPointCost', 'requiredInfluencePoints']);
        if (Object.keys(update.implicitSkillParams).length) {
          this.updateNumbers(level['implicitSkillParams'] as Record<string, unknown>, update.implicitSkillParams);
        }
      }
      documentSchema.parse(raw);
      const temporary = this.catalogPath + '.' + randomUUID() + '.tmp';
      try {
        await writeFile(temporary, JSON.stringify(raw, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
        await rename(temporary, this.catalogPath);
      } catch (error) {
        await rm(temporary, { force: true });
        throw error;
      }
      return true;
    });
    this.writeQueue = write.then(() => undefined, () => undefined);
    return write;
  }

  private updateNumbers(
    target: Record<string, unknown> | undefined,
    values: Readonly<Record<string, number | null>>,
    optionalKeys: readonly string[] = [],
  ): void {
    for (const [key, value] of Object.entries(values)) {
      const optional = optionalKeys.includes(key);
      if (!target || (!optional && (key === 'level' || !Object.hasOwn(target, key) || typeof target[key] !== 'number'))) {
        throw new Error('Unsupported skill level field: ' + key);
      }
      if (value === null && optional) delete target[key];
      else if (value !== null) target[key] = value;
      else throw new Error('Missing value for skill level field: ' + key);
    }
  }

  public async findAll(): Promise<readonly Skill[]> {
    const document = await this.readDocument();
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
