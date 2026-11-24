import { readSkillAssignments, writeSkillAssignments } from './SkillAssignmentDocument.ts';
import {
  PawnDefinition,
  PawnDefinitionId,
  PawnIdentity,
  PawnStats,
  PawnVisual,
  SkillId,
  SoldierPawnStats,
  WeaponKey,
} from '@game-data/domain';
import type { PawnDefinitionCatalogItemDocument } from './PawnDefinitionCatalogDocument.ts';

export class PawnDefinitionCatalogMapper {
  public toDomain(document: PawnDefinitionCatalogItemDocument): PawnDefinition {
    const assignments = readSkillAssignments(document.skills, document.innateSkillLevels, document.maxSkillLevels);
    const stats = document.nonePower !== undefined
      ? new SoldierPawnStats(
          document.power,
          document.turnCount,
        )
      : new PawnStats(
          document.turnCount,
          document.power,
          document.countPawns!,
          document.moveCount!,
        );

    return new PawnDefinition(
      new PawnIdentity(
        new PawnDefinitionId(document.id),
        document.color,
        document.type,
        document.displayName,
      ),
      stats,
      new PawnVisual(document.visualKey, new WeaponKey(document.weaponKey)),
      document.requiredInfluencePoints,
      assignments.ids?.map(id => new SkillId(id)),
      document.implicitSkillParams,
      assignments.initial,
      assignments.maximum,
    );
  }

  public toDocument(pawn: PawnDefinition): PawnDefinitionCatalogItemDocument {
    return {
      id: pawn.identity.id.value,
      displayName: pawn.identity.displayName,
      color: pawn.identity.color,
      type: pawn.identity.type,
      turnCount: pawn.stats.turnCount,
      power: pawn.stats.power,
      ...(pawn.stats instanceof SoldierPawnStats
        ? {
            nonePower: pawn.stats.nonePower,
          }
        : {
            countPawns: pawn.stats.countPawns,
            moveCount: pawn.stats.moveCount,
          }),
      visualKey: pawn.visual.visualKey,
      weaponKey: pawn.visual.weaponKey.value,
      requiredInfluencePoints: pawn.requiredInfluencePoints,
      skills: writeSkillAssignments(pawn.skills.map(String), pawn.innateSkillLevels, pawn.maxSkillLevels),
      implicitSkillParams: pawn.implicitSkillParams,
    };
  }
}
