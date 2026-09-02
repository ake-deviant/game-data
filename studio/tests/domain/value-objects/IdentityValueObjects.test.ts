import { describe, expect, it } from 'vitest';
import { PawnDefinitionId } from '../../../src/domain/value-objects/PawnDefinitionId';
import { SkillId } from '../../../src/domain/value-objects/SkillId';
import { WeaponKey } from '../../../src/domain/value-objects/WeaponKey';

describe.each([
  ['PawnDefinitionId', (value: string) => new PawnDefinitionId(value)],
  ['SkillId', (value: string) => new SkillId(value)],
  ['WeaponKey', (value: string) => new WeaponKey(value)],
])('%s', (_name, create) => {
  it('refuse une valeur vide', () => {
    expect(() => create('   ')).toThrow();
  });

  it('conserve une valeur valide', () => {
    expect(create('valid-id').toString()).toBe('valid-id');
  });
});
