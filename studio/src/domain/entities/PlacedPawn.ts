import { GridRuleError } from '../errors/GridRuleError.ts';
import { PawnIdentity } from '../value-objects/PawnIdentity.ts';
import { PawnDefinitionId } from '../value-objects/PawnDefinitionId.ts';
import type { GridPosition } from '../value-objects/GridPosition.ts';
import { PawnFootprint, type GridPawnRank } from '../value-objects/PawnFootprint.ts';
import type { PawnImplicitSkillParams } from './PawnDefinition.ts';

export interface PlacedPawnProps {
  readonly id: string;
  readonly identity: PawnIdentity;
  readonly rank: GridPawnRank;
  readonly position: GridPosition;
  readonly countPawns?: number;
  readonly moveCount?: number;
  readonly power: number;
  readonly turnCount: number | null;
  readonly visualKey: string;
  readonly weaponKey: string;
  readonly skills?: readonly string[];
  readonly implicitSkillParams?: Readonly<PawnImplicitSkillParams>;
  readonly defenseLevel?: number;
}

export class PlacedPawn {
  public readonly id: string;
  public readonly templateId: string;
  public readonly color: PawnIdentity['color'];
  public readonly type: PawnIdentity['type'];
  public readonly displayName?: string;
  public readonly rank: GridPawnRank;
  public readonly status: 'none' | 'attack' | 'defense';
  public readonly defenseLevel?: number;
  public readonly position: GridPosition;
  public readonly footprint: PawnFootprint;
  public readonly countPawns: number;
  public readonly moveCount?: number;
  public readonly power: number;
  public readonly turnCount: number | null;
  public readonly visualKey: string;
  public readonly weaponKey: string;
  public readonly skills?: readonly string[];
  public readonly implicitSkillParams?: Readonly<PawnImplicitSkillParams>;

  public constructor(props: PlacedPawnProps) {
    if (!Number.isInteger(props.power) || props.power < 1 || props.power > 200) {
      throw new GridRuleError('invalid-power', 'La puissance doit être un entier de 1 à 200.');
    }
    const isDefense = props.defenseLevel !== undefined;
    if (isDefense && (!Number.isInteger(props.defenseLevel) || props.defenseLevel! < 1)) {
      throw new GridRuleError('invalid-defense-level', 'Le niveau de défense doit être un entier positif.');
    }
    if (props.rank === 'troop' ? props.turnCount !== null
      : props.turnCount === null || !Number.isInteger(props.turnCount) || props.turnCount < 1 || props.turnCount > 9) {
      throw new GridRuleError('invalid-turn-count', 'Le compteur doit être un entier de 1 à 9 pour une attaque, et nul pour un soldat libre.');
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(props.id)
      || props.id === props.identity.id.value) {
      throw new GridRuleError('invalid-id', 'Chaque exemplaire doit avoir un UUID distinct de son modèle.');
    }
    const countPawns = props.countPawns ?? 1;
    if (!Number.isFinite(countPawns) || countPawns < 0) {
      throw new GridRuleError('invalid-capacity', 'Le poids du pion doit être un nombre positif ou nul.');
    }
    if (props.moveCount !== undefined && (!Number.isFinite(props.moveCount) || props.moveCount < 0)) {
      throw new GridRuleError('invalid-capacity', 'Le coût de placement doit être un nombre positif ou nul.');
    }
    this.id = props.id;
    this.templateId = props.identity.id.value;
    this.color = props.identity.color;
    this.type = props.identity.type;
    this.displayName = props.identity.displayName;
    this.rank = props.rank;
    this.status = props.defenseLevel !== undefined ? 'defense' : props.rank === 'troop' ? 'none' : 'attack';
    this.defenseLevel = props.defenseLevel;
    this.position = props.position;
    this.footprint = new PawnFootprint(props.rank);
    this.countPawns = countPawns;
    this.moveCount = props.moveCount;
    this.power = props.power;
    this.turnCount = props.turnCount;
    this.visualKey = props.visualKey;
    this.weaponKey = props.weaponKey;
    this.skills = props.skills ? [...props.skills] : undefined;
    this.implicitSkillParams = props.implicitSkillParams ? { ...props.implicitSkillParams } : undefined;
    Object.freeze(this);
  }

  public get occupiedCells(): readonly GridPosition[] {
    return this.footprint.cellsAt(this.position);
  }

  public at(position: GridPosition): PlacedPawn {
    return this.copy(position, this.power, this.turnCount);
  }

  public withValues(power: number, turnCount: number | null): PlacedPawn {
    return this.copy(this.position, power, turnCount);
  }

  private copy(position: GridPosition, power: number, turnCount: number | null): PlacedPawn {
    return new PlacedPawn({
      id: this.id, identity: new PawnIdentity(new PawnDefinitionId(this.templateId), this.color, this.type, this.displayName),
      rank: this.rank, position,
      countPawns: this.countPawns, moveCount: this.moveCount,
      power, turnCount, defenseLevel: this.defenseLevel,
      visualKey: this.visualKey, weaponKey: this.weaponKey, skills: this.skills, implicitSkillParams: this.implicitSkillParams,
    });
  }
}
