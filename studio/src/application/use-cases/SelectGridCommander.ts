import { GridPalettePolicy } from '@game-data/domain';
import type { PawnColor, PawnType } from '@game-data/domain';
import type { GridCatalog, GridPawnTemplate } from '../ports/GridCatalogReader.ts';

const BASIC_ATTACK_COLORS: PawnColor[] = ['red', 'blue', 'green'];
const BASIC_ATTACK_TYPES: PawnType[] = ['melee', 'ranged'];

export class SelectGridCommander {
  private readonly policy = new GridPalettePolicy();

  public execute(catalog: GridCatalog, commanderId: string) {
    const commander = catalog.commanders.find((item) => item.id === commanderId);
    if (!commander) throw new Error('Commandant introuvable dans le catalogue.');
    const pawns = catalog.pawns.filter((pawn) => this.policy.allows(commander, pawn));
    const references = [
      ...Object.entries(commander.pawnDefinitionIdByColor).map(([color, id]) => ({ id, role: 'soldier', color })),
      ...commander.officerPawnDefinitionIds.map((id) => ({ id, role: 'officer' })),
      ...commander.commanderPawnDefinitionIds.map((id) => ({ id, role: 'commander' })),
    ];
    const missing = references.filter((reference) => !pawns.some((pawn) =>
      pawn.id === reference.id && pawn.role === reference.role && (!('color' in reference) || pawn.color === reference.color)));
    if (missing.length) throw new Error(`Modèles de pions introuvables : ${missing.map((item) => item.id).join(', ')}.`);
    const basicAttackTemplates: GridPawnTemplate[] = BASIC_ATTACK_COLORS.flatMap((color) =>
      BASIC_ATTACK_TYPES.map((type): GridPawnTemplate => ({
        id: `basic-attack-${color}-${type}`,
        displayName: `Pions de base ${color} ${type}`,
        role: 'basic-attack',
        color,
        type,
        power: 8,
        turnCount: 1,
        visualKey: `pawn_default_${type}_${color}`,
        weaponKey: type === 'melee' ? 'spear' : 'arrow',
      }))
    );
    return { commander, pawns: [...pawns, ...basicAttackTemplates, ...(commander.defensePawnTemplates ?? [])] };
  }
}
