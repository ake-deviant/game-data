import { z } from 'zod';

export const pawnDefinitionCatalogItemSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().optional(),
  color: z.enum(['red', 'blue', 'green']),
  type: z.enum(['melee', 'ranged']),
  turnCount: z.number().nonnegative(),
  power: z.number().nonnegative(),
  countPawns: z.number().nonnegative().optional(),
  moveCount: z.number().nonnegative().optional(),
  nonePower: z.number().nonnegative().optional(),
  visualKey: z.string().min(1),
  weaponKey: z.string().min(1),
  requiredInfluencePoints: z.number().optional(),
  skills: z.array(z.string().min(1)).optional(),
  implicitSkillParams: z.object({
    powerBonusPerDecrement: z.number().optional(),
    columnPowerBonusPerDecrement: z.number().optional(),
    spBonusPerLiaison: z.number().optional(),
    spBonusPerAttackPawn: z.number().optional(),
    freeWallDestructsOnDecrement: z.number().optional(),
    liaisonBonusPercent: z.number().optional(),
    spGrowthBonus: z.number().optional(),
  }).optional(),
}).superRefine((pawn, context) => {
  const isSoldier = pawn.nonePower !== undefined;
  const isGrouped = pawn.countPawns !== undefined && pawn.moveCount !== undefined;

  if (!isSoldier && !isGrouped) {
    context.addIssue({
      code: 'custom',
      message: 'A pawn definition must contain nonePower or countPawns and moveCount.',
      path: ['countPawns'],
    });
  }
});

export const pawnDefinitionCatalogDocumentSchema = z.array(
  pawnDefinitionCatalogItemSchema,
);

export type PawnDefinitionCatalogItemDocument = z.infer<
  typeof pawnDefinitionCatalogItemSchema
>;
export type PawnDefinitionCatalogDocument = z.infer<
  typeof pawnDefinitionCatalogDocumentSchema
>;
