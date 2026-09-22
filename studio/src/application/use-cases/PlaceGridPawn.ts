import { GridPosition, PawnDefinitionId, PawnIdentity, PlacedPawn, type Grid } from '@game-data/domain';
import type { GridPawnTemplate } from '../ports/GridCatalogReader.ts';
import type { PlacementIdGenerator } from '../ports/PlacementIdGenerator.ts';

export class PlaceGridPawn {
  private readonly ids: PlacementIdGenerator;

  public constructor(ids: PlacementIdGenerator) {
    this.ids = ids;
  }

  public execute(grid: Grid, template: GridPawnTemplate, col: number, row: number): PlacedPawn {
    const pawn = this.prepare(template, col, row);
    grid.place(pawn);
    return pawn;
  }

  public prepare(template: GridPawnTemplate, col: number, row: number): PlacedPawn {
    const isDefense = template.role === 'defense';
    const isSoldier = template.role === 'soldier';
    return new PlacedPawn({
      id: this.ids.generate(),
      identity: new PawnIdentity(new PawnDefinitionId(template.id), template.color, template.type, template.displayName),
      rank: isSoldier || isDefense ? 'troop' : template.role,
      position: new GridPosition(col, row),
      countPawns: template.countPawns,
      moveCount: template.moveCount,
      power: isSoldier ? template.nonePower! : template.power,
      turnCount: isSoldier || isDefense ? null : template.turnCount,
      defenseLevel: template.defenseLevel,
      visualKey: template.visualKey, weaponKey: template.weaponKey,
      skills: template.skills, implicitSkillParams: template.implicitSkillParams,
    });
  }
}
