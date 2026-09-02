import type { WeaponKey } from './WeaponKey.ts';

export class PawnVisual {
  public readonly visualKey: string;
  public readonly weaponKey: WeaponKey;

  public constructor(
    visualKey: string,
    weaponKey: WeaponKey,
  ) {
    if (visualKey.trim().length === 0) {
      throw new Error('PawnVisual.visualKey is required.');
    }

    this.visualKey = visualKey;
    this.weaponKey = weaponKey;
  }
}
