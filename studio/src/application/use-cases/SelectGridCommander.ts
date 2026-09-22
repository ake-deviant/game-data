import { GridPalettePolicy } from '@game-data/domain';
import type { GridCatalog } from '../ports/GridCatalogReader.ts';

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
    return { commander, pawns: [...pawns, ...(commander.defensePawnTemplates ?? [])] };
  }
}
