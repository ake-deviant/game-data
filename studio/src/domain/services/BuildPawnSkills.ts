import type { PawnImplicitSkillParams } from '../entities/PawnDefinition.ts';

export function buildPawnSkillsFromParams(params?: Readonly<PawnImplicitSkillParams>): readonly string[] {
  if (!params) return [];
  const skills: string[] = [];
  if ((params.powerBonusPerDecrement ?? 0) > 0) skills.push('power-growth');
  if ((params.columnPowerBonusPerDecrement ?? 0) > 0) skills.push('increase-power-column-when-decrementing');
  if ((params.spBonusPerLiaison ?? 0) > 0) skills.push('increase-SP-by-attack-linked-when-preparing');
  if ((params.spBonusPerAttackPawn ?? 0) > 0) skills.push('increase-SP-by-attack-group-when-spawning');
  if ((params.freeWallDestructsOnDecrement ?? 0) > 0) skills.push('gain-FWD-on-decrement');
  if ((params.liaisonBonusPercent ?? 0) > 0) skills.push('liaison-power-bonus');
  if ((params.spGrowthBonus ?? 0) > 0) skills.push('sp-growth');
  return skills;
}
