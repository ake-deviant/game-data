import type { PawnDefinitionId } from './PawnDefinitionId.ts';

export type PawnColor = 'red' | 'blue' | 'green';

export type PawnType = 'melee' | 'ranged';

export class PawnIdentity {
  public readonly id: PawnDefinitionId;
  public readonly color: PawnColor;
  public readonly type: PawnType;
  public readonly displayName?: string;

  public constructor(
    id: PawnDefinitionId,
    color: PawnColor,
    type: PawnType,
    displayName?: string,
  ) {
    this.id = id;
    this.color = color;
    this.type = type;
    this.displayName = displayName;
  }
}
