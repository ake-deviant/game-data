export class ProductionCommanderCatalogMother {
  public static valid() {
    return [
      {
        id: 'commander-1',
        name: 'Commander',
        baseStats: {
          pawnMax: 40,
          health: 100,
          maxDefenseLevel: 2,
          wallVisualSet: 'default',
          defensePowerPerLevel: 6,
          movementsPerTurn: 3,
          soldierPawns: [
            ProductionCommanderCatalogMother.soldier('pawn-red', 'red'),
            ProductionCommanderCatalogMother.soldier('pawn-blue', 'blue'),
            ProductionCommanderCatalogMother.soldier('pawn-green', 'green'),
          ],
          commanderPawns: [{
            id: 'pawn-commander',
            displayName: 'Commander pawn',
            color: 'red',
            type: 'melee',
            turnCount: 4,
            power: 30,
            countPawns: 1,
            moveCount: 2,
            visualKey: 'commander-red',
            weaponKey: 'sword',
            requiredInfluencePoints: 10,
          }],
          officerPawns: [],
        },
      },
    ];
  }

  public static commanderWithId(id: string) {
    const commander = structuredClone(ProductionCommanderCatalogMother.valid()[0]);
    commander.id = id;
    commander.name = `Commander ${id}`;
    return commander;
  }

  private static soldier(id: string, color: string) {
    return {
      id,
      color,
      type: 'melee',
      turnCount: 2,
      power: 8,
      nonePower: 2,
      visualKey: `pawn-${color}`,
      weaponKey: 'sword',
    };
  }
}
