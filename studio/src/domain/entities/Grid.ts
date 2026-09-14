import { GridRuleError } from '../errors/GridRuleError.ts';
import { GridPalettePolicy, type GridCommanderSelection } from '../services/GridPalettePolicy.ts';
import type { GridPosition } from '../value-objects/GridPosition.ts';
import type { PlacedPawn } from './PlacedPawn.ts';

export interface GridCommander extends GridCommanderSelection {
  readonly id: string;
  readonly pawnMax: number;
}

export class Grid {
  public readonly rows = 7;
  public readonly cols = 9;
  public readonly commanderId: string;
  public readonly pawnMax: number;
  private readonly commander: GridCommanderSelection;
  private readonly placements = new Map<string, PlacedPawn>();
  private readonly palettePolicy = new GridPalettePolicy();

  public constructor(commander: GridCommander) {
    if (!Number.isInteger(commander.pawnMax) || commander.pawnMax < 0) {
      throw new GridRuleError('invalid-capacity', 'La capacité de la grille doit être un entier positif ou nul.');
    }
    this.commanderId = commander.id;
    this.pawnMax = commander.pawnMax;
    this.commander = {
      pawnDefinitionIdByColor: { ...commander.pawnDefinitionIdByColor },
      officerPawnDefinitionIds: [...commander.officerPawnDefinitionIds],
      commanderPawnDefinitionIds: [...commander.commanderPawnDefinitionIds],
    };
  }

  public get pawns(): readonly PlacedPawn[] { return [...this.placements.values()]; }
  public get consumedCapacity(): number { return this.pawns.reduce((total, pawn) => total + pawn.countPawns, 0); }
  public get remainingCapacity(): number { return this.pawnMax - this.consumedCapacity; }

  public place(pawn: PlacedPawn): void {
    this.assertCanPlace(pawn);
    this.placements.set(pawn.id, pawn);
  }

  public assertCanPlace(pawn: PlacedPawn): void {
    if (this.placements.has(pawn.id)) throw new GridRuleError('duplicate-id', 'Cet UUID est déjà utilisé dans la grille.');
    if (!this.palettePolicy.allows(this.commander, {
      id: pawn.templateId, color: pawn.color, role: pawn.rank === 'troop' ? 'soldier' : pawn.rank,
    })) throw new GridRuleError('unavailable-template', 'Ce modèle de pion n’appartient pas au commandant.');
    if (pawn.rank !== 'troop' && this.pawns.some((placed) => placed.rank === pawn.rank && placed.templateId === pawn.templateId)) {
      throw new GridRuleError('duplicate-template', 'Un exemplaire de ce modèle est déjà placé.');
    }
    this.assertSpace(pawn);
    if (this.consumedCapacity + pawn.countPawns > this.pawnMax) {
      throw new GridRuleError('capacity-exceeded', 'La capacité maximale du commandant est dépassée.');
    }
  }

  public move(id: string, position: GridPosition): PlacedPawn {
    const pawn = this.assertCanMove(id, position);
    this.placements.set(id, pawn);
    return pawn;
  }

  public assertCanMove(id: string, position: GridPosition): PlacedPawn {
    const pawn = this.find(id).at(position);
    this.assertSpace(pawn, id);
    return pawn;
  }

  public updateValues(id: string, power: number, turnCount: number | null): PlacedPawn {
    const pawn = this.find(id).withValues(power, turnCount);
    this.placements.set(id, pawn);
    return pawn;
  }

  public remove(id: string): void {
    this.find(id);
    this.placements.delete(id);
  }

  public find(id: string): PlacedPawn {
    const pawn = this.placements.get(id);
    if (!pawn) throw new GridRuleError('pawn-not-found', 'Ce pion n’est pas présent dans la grille.');
    return pawn;
  }

  private assertSpace(pawn: PlacedPawn, ignoredId?: string): void {
    const cells = pawn.occupiedCells;
    if (cells.some((cell) => cell.col >= this.cols || cell.row >= this.rows)) {
      throw new GridRuleError('out-of-bounds', 'L’empreinte du pion dépasse les limites de la grille.');
    }
    if (this.pawns.some((placed) => placed.id !== ignoredId
      && placed.occupiedCells.some((occupied) => cells.some((cell) => cell.equals(occupied))))) {
      throw new GridRuleError('collision', 'Une case de l’empreinte est déjà occupée.');
    }
  }
}
