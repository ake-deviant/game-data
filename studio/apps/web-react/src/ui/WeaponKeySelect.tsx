import type { PawnType } from '@game-data/presentation';
import { inputClass } from './ui-kit';
import { weaponKeysForType } from './weaponKeys';

interface Props {
  readonly type: PawnType;
  readonly value: string;
  readonly onChange: (weaponKey: string) => void;
}

export function WeaponKeySelect({ type, value, onChange }: Props) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Sélectionner une arme…</option>
      {weaponKeysForType(type).map((weaponKey) => (
        <option key={weaponKey} value={weaponKey}>{weaponKey}</option>
      ))}
    </select>
  );
}
