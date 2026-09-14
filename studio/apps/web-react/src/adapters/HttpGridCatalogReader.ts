import type { GridCatalogReader, GridCatalog } from '@game-data/application';
import { z } from 'zod';

const commanderSchema = z.object({
  id: z.string().min(1), name: z.string(), pawnMax: z.number().int().nonnegative(),
  pawnDefinitionIdByColor: z.object({ red: z.string(), blue: z.string(), green: z.string() }),
  officerPawnDefinitionIds: z.array(z.string()), commanderPawnDefinitionIds: z.array(z.string()),
});
const pawnSchema = z.object({
  id: z.string().min(1), displayName: z.string(), role: z.enum(['soldier', 'officer', 'commander']),
  color: z.enum(['red', 'blue', 'green']), type: z.enum(['melee', 'ranged']),
  power: z.number(), turnCount: z.number(), nonePower: z.number().optional(),
  countPawns: z.number().optional(), moveCount: z.number().optional(),
  visualKey: z.string(), weaponKey: z.string(), skills: z.array(z.string()).optional(),
  implicitSkillParams: z.object({
    powerBonusPerDecrement: z.number().optional(), columnPowerBonusPerDecrement: z.number().optional(),
    spBonusPerLiaison: z.number().optional(), spBonusPerAttackPawn: z.number().optional(),
    freeWallDestructsOnDecrement: z.number().optional(), liaisonBonusPercent: z.number().optional(),
    spGrowthBonus: z.number().optional(),
  }).optional(),
}).refine((pawn) => pawn.role !== 'soldier' || pawn.nonePower !== undefined);

export class HttpGridCatalogReader implements GridCatalogReader {
  public async read(): Promise<GridCatalog> {
    const [commanders, pawns] = await Promise.all([
      this.get('/api/catalog/commanders'), this.get('/api/catalog/pawns'),
    ]);
    return { commanders: z.array(commanderSchema).parse(commanders), pawns: z.array(pawnSchema).parse(pawns) };
  }

  private async get(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Impossible de charger le catalogue interne.');
    return response.json();
  }
}
