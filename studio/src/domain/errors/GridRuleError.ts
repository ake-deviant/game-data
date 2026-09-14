export type GridRuleCode =
  | 'invalid-position' | 'invalid-rank' | 'invalid-id' | 'invalid-capacity'
  | 'duplicate-id' | 'duplicate-template' | 'unavailable-template'
  | 'out-of-bounds' | 'collision' | 'capacity-exceeded' | 'pawn-not-found' | 'invalid-power' | 'invalid-turn-count';

export class GridRuleError extends Error {
  public readonly code: GridRuleCode;

  public constructor(code: GridRuleCode, message: string) {
    super(message);
    this.name = 'GridRuleError';
    this.code = code;
  }
}
