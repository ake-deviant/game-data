import { describe, expect, it } from 'vitest';
import { PawnDefinition } from '../../../src/domain/entities/PawnDefinition';
import { PawnDefinitionId } from '../../../src/domain/value-objects/PawnDefinitionId';
import { PawnIdentity } from '../../../src/domain/value-objects/PawnIdentity';
import { PawnStats } from '../../../src/domain/value-objects/PawnStats';
import { PawnVisual } from '../../../src/domain/value-objects/PawnVisual';
import { SkillId } from '../../../src/domain/value-objects/SkillId';
import { WeaponKey } from '../../../src/domain/value-objects/WeaponKey';

describe('PawnDefinition', () => {
  it('protège sa liste de compétences', () => {
    const source = [new SkillId('charge-30')];
    const pawn = createPawn(source);

    source.push(new SkillId('charge-50'));

    expect(pawn.skills.map(String)).toEqual(['charge-30']);
  });

  it('protège ses paramètres implicites', () => {
    const source = { powerBonusPerDecrement: 10 };
    const pawn = createPawn([], source);

    source.powerBonusPerDecrement = 20;

    expect(pawn.implicitSkillParams?.powerBonusPerDecrement).toBe(10);
  });
});

function createPawn(
  skills: readonly SkillId[] = [],
  implicitSkillParams?: { powerBonusPerDecrement?: number },
): PawnDefinition {
  return new PawnDefinition(
    new PawnIdentity(new PawnDefinitionId('pawn-1'), 'red', 'melee'),
    new PawnStats(2, 10, 1, 1),
    new PawnVisual('pawn-red', new WeaponKey('sword')),
    undefined,
    skills,
    implicitSkillParams,
  );
}
