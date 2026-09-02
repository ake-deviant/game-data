import { z } from 'zod';

const pawnIdsByColorSchema = z.object({
  red: z.string().min(1),
  blue: z.string().min(1),
  green: z.string().min(1),
});

const optionalSkillsByColorSchema = z.object({
  red: z.array(z.string().min(1)).optional(),
  blue: z.array(z.string().min(1)).optional(),
  green: z.array(z.string().min(1)).optional(),
}).optional();

const optionalNumbersByColorSchema = z.object({
  red: z.number().optional(),
  blue: z.number().optional(),
  green: z.number().optional(),
}).optional();

const movementStrategySchema = z.enum([
  'after-first-match',
  '1-match-1-move',
]);

export const commanderCatalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  baseStats: z.object({
    pawnMax: z.number(),
    health: z.number(),
    maxDefenseLevel: z.number(),
    wallVisualSet: z.string().min(1),
    defensePowerPerLevel: z.number(),
    pawnDefinitionIdByColor: pawnIdsByColorSchema,
    commanderPawnDefinitionIds: z.array(z.string().min(1)),
    officerPawnDefinitionIds: z.array(z.string().min(1)),
    movementsPerTurn: z.number(),
    skills: z.array(z.string().min(1)).optional(),
    innateSkills: z.array(z.string().min(1)).optional(),
    freeRecruitThreshold: z.number().optional(),
    skillsByColor: optionalSkillsByColorSchema,
    powerBonusPerDecrementByColor: optionalNumbersByColorSchema,
    movementBonusStrategies: z.object({
      place: movementStrategySchema.optional(),
      remove: movementStrategySchema.optional(),
    }).optional(),
  }),
});

export const commanderCatalogDocumentSchema = z.array(commanderCatalogItemSchema);

export type CommanderCatalogItemDocument = z.infer<typeof commanderCatalogItemSchema>;
export type CommanderCatalogDocument = z.infer<typeof commanderCatalogDocumentSchema>;
