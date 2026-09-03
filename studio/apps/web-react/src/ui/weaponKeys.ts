import weaponKeysData from '../../../../../data/weaponKeys.json';
import type { PawnType } from '@game-data/presentation';

const weaponKeys: Record<PawnType, readonly string[]> = weaponKeysData;

export function weaponKeysForType(type: PawnType): readonly string[] {
  return weaponKeys[type];
}

export function weaponKeyAfterTypeChange(currentWeaponKey: string, type: PawnType): string {
  return weaponKeysForType(type).includes(currentWeaponKey) ? currentWeaponKey : '';
}
