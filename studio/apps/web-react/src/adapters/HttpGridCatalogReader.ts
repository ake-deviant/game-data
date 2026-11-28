import type { GridCatalogReader, GridCatalog, GridCommanderItem, GridPawnTemplate } from '@game-data/application';
import { buildPawnSkillsFromParams } from '@game-data/domain';
import { z } from 'zod';

const commanderSchema = z.object({
  id: z.string().min(1), name: z.string(), pawnMax: z.number().int().nonnegative(),
  pawnDefinitionIdByColor: z.object({ red: z.string(), blue: z.string(), green: z.string() }),
  officerPawnDefinitionIds: z.array(z.string()), commanderPawnDefinitionIds: z.array(z.string()),
  wallVisualSet: z.string(), maxDefenseLevel: z.number().int().nonnegative(), defensePowerPerLevel: z.number(),
});

const pawnSchema = z.object({
  id: z.string().min(1), displayName: z.string(), role: z.enum(['soldier', 'officer', 'commander']),
  color: z.enum(['red', 'blue', 'green']), type: z.enum(['melee', 'ranged']),
  power: z.number(), turnCount: z.number(), nonePower: z.number().optional(),
  countPawns: z.number().optional(), moveCount: z.number().optional(),
  visualKey: z.string(), weaponKey: z.string(), skills: z.array(z.string()).optional(),
  innateSkillLevels: z.record(z.string(), z.number().int().nonnegative()).optional(),
  implicitSkillParams: z.object({
    powerBonusPerDecrement: z.number().optional(), columnPowerBonusPerDecrement: z.number().optional(),
    spBonusPerLiaison: z.number().optional(), spBonusPerAttackPawn: z.number().optional(),
    freeWallDestructsOnDecrement: z.number().optional(), liaisonBonusPercent: z.number().optional(),
    spGrowthBonus: z.number().optional(),
  }).optional(),
}).refine((pawn) => pawn.role !== 'soldier' || pawn.nonePower !== undefined);

const wallVisualSetSchema = z.object({
  id: z.string(), keyByLevel: z.record(z.string(), z.string()),
});

const pawnSkillCatalogSchema = z.object({
  pawnSkillVisuals: z.array(z.object({
    id: z.string(),
    activationType: z.string().optional(),
    levels: z.array(z.object({
      level: z.number(),
      implicitSkillParams: z.record(z.string(), z.number()).optional(),
    })).optional(),
  })),
});

export class HttpGridCatalogReader implements GridCatalogReader {
  public async read(): Promise<GridCatalog> {
    const [rawCommanders, pawns, wallVisualSets, rawSkills] = await Promise.all([
      this.get('/api/catalog/commanders'),
      this.get('/api/catalog/pawns'),
      this.get('/api/catalog/wall-visual-sets'),
      this.get('/api/catalog/skills'),
    ]);

    const parsedCommanders = z.array(commanderSchema).parse(rawCommanders);
    const parsedWallSets = z.array(wallVisualSetSchema).parse(wallVisualSets);
    const wallSetById = new Map(parsedWallSets.map((s) => [s.id, s.keyByLevel]));

    const commanders: GridCommanderItem[] = parsedCommanders.map((c) => {
      const keyByLevel = wallSetById.get(c.wallVisualSet) ?? {};
      const defensePawnTemplates: GridPawnTemplate[] = Array.from(
        { length: c.maxDefenseLevel },
        (_, i) => {
          const level = i + 1;
          return {
            id: `${c.id}-defense-${level}`,
            displayName: `Mur niv. ${level}`,
            role: 'defense' as const,
            color: 'blue' as const,
            type: 'melee' as const,
            power: Math.round(c.defensePowerPerLevel * level),
            turnCount: 0,
            countPawns: 1,
            defenseLevel: level,
            visualKey: keyByLevel[String(level)] ?? '',
            weaponKey: '',
          };
        },
      );
      return {
        id: c.id, name: c.name, pawnMax: c.pawnMax,
        pawnDefinitionIdByColor: c.pawnDefinitionIdByColor,
        officerPawnDefinitionIds: c.officerPawnDefinitionIds,
        commanderPawnDefinitionIds: c.commanderPawnDefinitionIds,
        defensePawnDefinitionIds: defensePawnTemplates.map((t) => t.id),
        defensePawnTemplates,
      };
    });

    const skillCatalog = pawnSkillCatalogSchema.parse(rawSkills);
    const skillsById = new Map(skillCatalog.pawnSkillVisuals.map(skill => [skill.id, skill]));
    const templates = z.array(pawnSchema).parse(pawns).map((pawn): GridPawnTemplate => {
      if (pawn.role === 'soldier') return pawn;

      const skills: string[] = [];
      const implicitSkillParams = { ...pawn.implicitSkillParams };
      for (const id of new Set([...(pawn.skills ?? []), ...buildPawnSkillsFromParams(pawn.implicitSkillParams)])) {
        const definition = skillsById.get(id);
        const level = pawn.innateSkillLevels?.[id] ?? (definition?.activationType ? 0 : 1);
        for (const effect of definition?.levels ?? []) {
          for (const key of Object.keys(effect.implicitSkillParams ?? {})) {
            delete implicitSkillParams[key as keyof typeof implicitSkillParams];
          }
        }
        if (level === 0) continue;
        skills.push(id);
        Object.assign(implicitSkillParams, definition?.levels?.find(effect => effect.level === level)?.implicitSkillParams);
      }
      return { ...pawn, skills, implicitSkillParams };
    });
    return { commanders, pawns: templates };
  }

  private async get(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Impossible de charger le catalogue interne.');
    return response.json();
  }
}
