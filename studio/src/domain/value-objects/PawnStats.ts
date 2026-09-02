export class PawnStats {
  public readonly turnCount: number;
  public readonly power: number;
  public readonly countPawns: number;
  public readonly moveCount: number;

  public constructor(
    turnCount: number,
    power: number,
    countPawns: number,
    moveCount: number,
  ) {
    PawnStats.assertNonNegative(turnCount, 'turnCount');
    PawnStats.assertNonNegative(power, 'power');
    PawnStats.assertNonNegative(countPawns, 'countPawns');
    PawnStats.assertNonNegative(moveCount, 'moveCount');
    this.turnCount = turnCount;
    this.power = power;
    this.countPawns = countPawns;
    this.moveCount = moveCount;
  }

  private static assertNonNegative(value: number, field: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`PawnStats.${field} must be a non-negative number.`);
    }
  }
}

export class SoldierPawnStats {
  public readonly power: number;
  public readonly turnCount: number;
  public readonly nonePower: number;

  public constructor(power: number, turnCount: number, nonePower: number) {
    SoldierPawnStats.assertNonNegative(power, 'power');
    SoldierPawnStats.assertNonNegative(turnCount, 'turnCount');
    SoldierPawnStats.assertNonNegative(nonePower, 'nonePower');
    this.power = power;
    this.turnCount = turnCount;
    this.nonePower = nonePower;
  }

  private static assertNonNegative(value: number, field: string): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`SoldierPawnStats.${field} must be a non-negative number.`);
    }
  }
}
