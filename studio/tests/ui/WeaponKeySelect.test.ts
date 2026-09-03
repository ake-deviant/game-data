import { describe, expect, it } from 'vitest';
import {
  weaponKeyAfterTypeChange,
  weaponKeysForType,
} from '../../apps/web-react/src/ui/weaponKeys';

describe('WeaponKeySelect', () => {
  it('propose uniquement les armes de mêlée pour un pion melee', () => {
    expect(weaponKeysForType('melee')).toEqual([
      'sword',
      'spear',
      'wooden_spiked_club',
      'woodcutter_poleaxe',
      'short_iron_katana',
    ]);
  });

  it('propose uniquement les projectiles pour un pion ranged', () => {
    expect(weaponKeysForType('ranged')).toEqual(['arrow', 'shuriken']);
  });

  it('retire une arme devenue incompatible après un changement de type', () => {
    expect(weaponKeyAfterTypeChange('sword', 'ranged')).toBe('');
    expect(weaponKeyAfterTypeChange('arrow', 'ranged')).toBe('arrow');
  });
});
