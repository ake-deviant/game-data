export interface GridCellDocument {
  readonly col: number;
  readonly row: number;
}

export interface GridPawnDocument {
  readonly id: string;
  readonly color: string;
  readonly status: 'none' | 'attack' | 'defense';
  readonly defenseLevel?: number;
  readonly type: string;
  readonly turnCount: number | null;
  readonly power: number;
  readonly countPawns?: number;
  readonly moveCount?: number;
  readonly x: number;
  readonly y: number;
  readonly rank: 'troop' | 'officer' | 'commander';
  readonly footprint?: string;
  readonly occupiedCells?: readonly GridCellDocument[];
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly templateId: string;
  readonly skills?: readonly string[];
  readonly implicitSkillParams?: Readonly<Record<string, number>>;
}

export interface GridDocument {
  readonly rows: 7;
  readonly cols: 9;
  readonly pawns: readonly GridPawnDocument[];
}
