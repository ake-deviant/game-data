import type { Skill, WallVisualSet, WeaponKey } from '@game-data/domain';

export interface ProductionReferenceCatalogs {
  readonly skills: readonly Skill[];
  readonly weaponKeys: readonly WeaponKey[];
  readonly wallVisualSets: readonly WallVisualSet[];
}

export class ProductionGameDataValidationError extends Error {
  public readonly errors: readonly string[];

  public constructor(errors: readonly string[]) {
    super(errors.join('\n'));
    this.name = 'ProductionGameDataValidationError';
    this.errors = errors;
  }
}

export class ProductionGameDataValidator {
  private skillIds: ReadonlySet<string> = new Set();
  private weaponKeys: ReadonlySet<string> = new Set();
  private wallVisualSetIds: ReadonlySet<string> = new Set();

  public validate(gameData: unknown, references: ProductionReferenceCatalogs): void {
    this.skillIds = new Set(references.skills.map((skill) => skill.id.value));
    this.weaponKeys = new Set(references.weaponKeys.map((key) => key.value));
    this.wallVisualSetIds = new Set(references.wallVisualSets.map((set) => set.id));
    const errors: string[] = [];
    const commanders = this.array(gameData, 'Commander catalog', errors);
    if (!commanders) throw new ProductionGameDataValidationError(errors);

    const commanderIds = new Set<string>();
    commanders.forEach((value, index) => {
      const path = `commanders[${index}]`;
      const commander = this.record(value, path, errors);
      if (!commander) return;

      const id = this.nonEmptyString(commander['id'], `${path}.id`, errors);
      this.nonEmptyString(commander['name'], `${path}.name`, errors);
      if (id && commanderIds.has(id)) errors.push(`Duplicate Commander id '${id}'.`);
      if (id) commanderIds.add(id);

      const stats = this.record(commander['baseStats'], `${path}.baseStats`, errors);
      if (!stats) return;

      for (const field of [
        'pawnMax',
        'health',
        'maxDefenseLevel',
        'defensePowerPerLevel',
        'movementsPerTurn',
      ]) {
        this.nonNegativeNumber(stats[field], `${path}.baseStats.${field}`, errors);
      }
      if (stats['freeRecruitThreshold'] !== undefined) {
        this.nonNegativeNumber(stats['freeRecruitThreshold'], `${path}.baseStats.freeRecruitThreshold`, errors);
      }

      const wallVisualSet = this.nonEmptyString(stats['wallVisualSet'], `${path}.baseStats.wallVisualSet`, errors);
      if (wallVisualSet && !this.wallVisualSetIds.has(wallVisualSet)) {
        errors.push(`Unknown wall visual set '${wallVisualSet}'.`);
      }

      const skills = this.skills(stats['skills'], `${path}.baseStats.skills`, errors);
      const innateSkills = this.skills(stats['innateSkills'], `${path}.baseStats.innateSkills`, errors);
      const overlap = skills.find((skill) => innateSkills.includes(skill));
      if (overlap) errors.push(`Skill '${overlap}' cannot be both activable and innate.`);

      const soldiers = this.array(stats['soldierPawns'], `${path}.baseStats.soldierPawns`, errors);
      if (soldiers) {
        if (soldiers.length !== 3) errors.push('A Commander must contain exactly three soldiers.');
        const soldierColors = soldiers.flatMap((soldier, pawnIndex) => {
          const color = this.validatePawn(
            soldier,
            `${path}.baseStats.soldierPawns[${pawnIndex}]`,
            true,
            errors,
          );
          return color ? [color] : [];
        });
        for (const color of ['red', 'blue', 'green']) {
          if (soldierColors.filter((candidate) => candidate === color).length !== 1) {
            errors.push(`A Commander must contain exactly one ${color} soldier.`);
          }
        }
      }

      for (const collection of ['commanderPawns', 'officerPawns']) {
        const pawns = this.array(stats[collection], `${path}.baseStats.${collection}`, errors);
        pawns?.forEach((pawn, pawnIndex) => this.validatePawn(
          pawn,
          `${path}.baseStats.${collection}[${pawnIndex}]`,
          false,
          errors,
        ));
      }
    });

    if (errors.length > 0) throw new ProductionGameDataValidationError(errors);
  }

  private validatePawn(
    value: unknown,
    path: string,
    soldier: boolean,
    errors: string[],
  ): string | null {
    const pawn = this.record(value, path, errors);
    if (!pawn) return null;

    this.nonEmptyString(pawn['id'], `${path}.id`, errors);
    this.nonEmptyString(pawn['visualKey'], `${path}.visualKey`, errors);
    const weaponKey = this.nonEmptyString(pawn['weaponKey'], `${path}.weaponKey`, errors);
    if (weaponKey && !this.weaponKeys.has(weaponKey)) errors.push(`Unknown weapon key '${weaponKey}'.`);

    const color = this.nonEmptyString(pawn['color'], `${path}.color`, errors);
    if (color && !['red', 'blue', 'green'].includes(color)) {
      errors.push(`${path}.color must be red, blue or green.`);
    }
    const type = this.nonEmptyString(pawn['type'], `${path}.type`, errors);
    if (type && !['melee', 'ranged'].includes(type)) {
      errors.push(`${path}.type must be melee or ranged.`);
    }

    const turnCount = this.nonNegativeNumber(pawn['turnCount'], `${path}.turnCount`, errors);
    this.nonNegativeNumber(pawn['power'], `${path}.power`, errors);
    if (pawn['requiredInfluencePoints'] !== undefined) {
      this.nonNegativeNumber(pawn['requiredInfluencePoints'], `${path}.requiredInfluencePoints`, errors);
    }
    this.skills(pawn['skills'], `${path}.skills`, errors);

    if (soldier) {
      const nonePower = this.nonNegativeNumber(pawn['nonePower'], `${path}.nonePower`, errors);
      if (nonePower !== null && turnCount !== null && nonePower !== turnCount) {
        errors.push(`${path}.nonePower must equal turnCount.`);
      }
    } else {
      this.nonNegativeNumber(pawn['countPawns'], `${path}.countPawns`, errors);
      this.nonNegativeNumber(pawn['moveCount'], `${path}.moveCount`, errors);
    }

    return color;
  }

  private skills(value: unknown, path: string, errors: string[]): string[] {
    if (value === undefined) return [];
    const values = this.array(value, path, errors);
    if (!values) return [];
    const skills = values.flatMap((skill, index) => {
      const id = this.nonEmptyString(skill, `${path}[${index}]`, errors);
      return id ? [id] : [];
    });
    for (const skill of skills) {
      if (!this.skillIds.has(skill)) errors.push(`Unknown skill id '${skill}'.`);
    }
    if (skills.filter((skill) => /^charge-\d+$/.test(skill)).length > 1) {
      errors.push(`${path} cannot contain more than one charge skill.`);
    }
    return skills;
  }

  private array(value: unknown, path: string, errors: string[]): unknown[] | null {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`);
      return null;
    }
    return value;
  }

  private record(value: unknown, path: string, errors: string[]): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${path} must be an object.`);
      return null;
    }
    return value as Record<string, unknown>;
  }

  private nonEmptyString(value: unknown, path: string, errors: string[]): string | null {
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`${path} must be a non-empty string.`);
      return null;
    }
    return value;
  }

  private nonNegativeNumber(value: unknown, path: string, errors: string[]): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      errors.push(`${path} must be a finite non-negative number.`);
      return null;
    }
    return value;
  }
}
