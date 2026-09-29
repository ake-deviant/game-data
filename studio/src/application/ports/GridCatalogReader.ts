import type { PawnColor, PawnType, PawnImplicitSkillParams, GridCommanderSelection } from '@game-data/domain';

export interface GridCommanderItem extends GridCommanderSelection {
  readonly id: string;
  readonly name: string;
  readonly pawnMax: number;
  readonly defensePawnTemplates?: readonly GridPawnTemplate[];
}

export interface GridPawnTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly role: 'soldier' | 'officer' | 'commander' | 'defense';
  readonly defenseLevel?: number;
  readonly color: PawnColor;
  readonly type: PawnType;
  readonly power: number;
  readonly turnCount: number;
  readonly nonePower?: number;
  readonly countPawns?: number;
  readonly moveCount?: number;
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly skills?: readonly string[];
  readonly implicitSkillParams?: Readonly<PawnImplicitSkillParams>;
}

export interface GridCatalog {
  readonly commanders: readonly GridCommanderItem[];
  readonly pawns: readonly GridPawnTemplate[];
}

export interface GridCatalogReader {
  read(): Promise<GridCatalog>;
}
