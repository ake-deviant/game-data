import { PawnSkill, SoldierPawnStats, type PawnDefinition, type Skill } from '@game-data/domain';
import type { CommanderCatalogRepository } from '../ports/CommanderCatalogRepository.ts';
import type { CommanderPawnDefinitionRepository } from '../ports/CommanderPawnDefinitionRepository.ts';
import type { OfficerPawnDefinitionRepository } from '../ports/OfficerPawnDefinitionRepository.ts';
import type { SoldierPawnDefinitionRepository } from '../ports/SoldierPawnDefinitionRepository.ts';
import type { SkillCatalogRepository } from '../ports/SkillCatalogRepository.ts';
import type { WallVisualSetCatalogRepository } from '../ports/WallVisualSetCatalogRepository.ts';
import type { WeaponKeyCatalogRepository } from '../ports/WeaponKeyCatalogRepository.ts';
import type { ProductionGameDataValidator } from '../services/ProductionGameDataValidator.ts';
import type { ProductionCommanderCatalogRepository } from '../ports/ProductionCommanderCatalogRepository.ts';
import type {
  ProductionCommanderDocument,
  ProductionPawnDocument,
  ProductionSkillAssignment,
} from '../models/ProductionCommanderDocument.ts';

export interface GenerateProductionGameDataRequest {
  readonly commanderIds: readonly string[];
}

export class GenerateProductionGameData {
  private readonly commanderCatalog: CommanderCatalogRepository;
  private readonly soldierCatalog: SoldierPawnDefinitionRepository;
  private readonly commanderPawnCatalog: CommanderPawnDefinitionRepository;
  private readonly officerPawnCatalog: OfficerPawnDefinitionRepository;
  private readonly productionCommanderCatalog: ProductionCommanderCatalogRepository;
  private readonly skillCatalog: SkillCatalogRepository;
  private readonly weaponKeyCatalog: WeaponKeyCatalogRepository;
  private readonly wallVisualSetCatalog: WallVisualSetCatalogRepository;
  private readonly validator: ProductionGameDataValidator;

  public constructor(
    commanderCatalog: CommanderCatalogRepository,
    soldierCatalog: SoldierPawnDefinitionRepository,
    commanderPawnCatalog: CommanderPawnDefinitionRepository,
    officerPawnCatalog: OfficerPawnDefinitionRepository,
    productionCommanderCatalog: ProductionCommanderCatalogRepository,
    skillCatalog: SkillCatalogRepository,
    weaponKeyCatalog: WeaponKeyCatalogRepository,
    wallVisualSetCatalog: WallVisualSetCatalogRepository,
    validator: ProductionGameDataValidator,
  ) {
    this.commanderCatalog = commanderCatalog;
    this.soldierCatalog = soldierCatalog;
    this.commanderPawnCatalog = commanderPawnCatalog;
    this.officerPawnCatalog = officerPawnCatalog;
    this.productionCommanderCatalog = productionCommanderCatalog;
    this.skillCatalog = skillCatalog;
    this.weaponKeyCatalog = weaponKeyCatalog;
    this.wallVisualSetCatalog = wallVisualSetCatalog;
    this.validator = validator;
  }

  public async execute(
    request: GenerateProductionGameDataRequest,
  ): Promise<readonly ProductionCommanderDocument[]> {
    const [
      commanders,
      soldiers,
      commanderPawns,
      officerPawns,
      existingProductionCommanders,
      skills,
      weaponKeys,
      wallVisualSets,
    ] = await Promise.all([
      this.commanderCatalog.findAll(),
      this.soldierCatalog.findAll(),
      this.commanderPawnCatalog.findAll(),
      this.officerPawnCatalog.findAll(),
      this.productionCommanderCatalog.findAll(),
      this.skillCatalog.findAll(),
      this.weaponKeyCatalog.findAll(),
      this.wallVisualSetCatalog.findAll(),
    ]);
    const skillsById = new Map(skills.map(skill => [skill.id.value, skill]));
    const commanderById = new Map(commanders.map((commander) => [commander.id, commander]));
    const soldierById = this.indexPawns(soldiers);
    const commanderPawnById = this.indexPawns(commanderPawns);
    const officerPawnById = this.indexPawns(officerPawns);

    const documents = request.commanderIds.map((commanderId) => {
      const commander = commanderById.get(commanderId);
      if (!commander) throw new Error(`Commander '${commanderId}' not found.`);

      const stats = commander.baseStats;
      const assignments = this.skillAssignments(
        [...(stats.skills ?? []), ...(stats.innateSkills ?? [])].map(String),
        { ...Object.fromEntries((stats.innateSkills ?? []).map(id => [String(id), 1])), ...stats.innateSkillLevels },
        { ...Object.fromEntries((stats.innateSkills ?? []).map(id => [String(id), 1])), ...stats.maxSkillLevels },
        skillsById,
      );
      return {
        id: commander.id,
        name: commander.name,
        ...(commander.description && { description: commander.description }),
        ...(commander.icon && { icon: commander.icon }),
        baseStats: {
          pawnMax: stats.pawnMax,
          health: stats.health,
          maxDefenseLevel: stats.maxDefenseLevel,
          wallVisualSet: stats.wallVisualSet,
          defensePowerPerLevel: stats.defensePowerPerLevel,
          movementsPerTurn: stats.movementsPerTurn,
          soldierPawns: (['red', 'blue', 'green'] as const).map((color) =>
            this.requiredPawn(soldierById, stats.pawnDefinitionIdByColor[color].value),
          ).map((pawn) => this.toDocument(pawn, skillsById)),
          commanderPawns: stats.commanderPawnDefinitionIds.map((id) =>
            this.toDocument(this.requiredPawn(commanderPawnById, id.value), skillsById),
          ),
          officerPawns: stats.officerPawnDefinitionIds.map((id) =>
            this.toDocument(this.requiredPawn(officerPawnById, id.value), skillsById),
          ),
          ...(assignments.length > 0 && { skills: assignments }),
          ...(stats.freeRecruitThreshold !== undefined && {
            freeRecruitThreshold: stats.freeRecruitThreshold,
          }),
        },
      };
    });

    const finalCatalog = [...existingProductionCommanders];
    for (const document of documents) {
      const index = finalCatalog.findIndex(({ id }) => id === document.id);
      if (index === -1) finalCatalog.push(document);
      else finalCatalog[index] = document;
    }

    this.validator.validate(finalCatalog, { skills, weaponKeys, wallVisualSets });
    return finalCatalog;
  }

  private indexPawns(pawns: readonly PawnDefinition[]): Map<string, PawnDefinition> {
    return new Map(pawns.map((pawn) => [pawn.identity.id.value, pawn]));
  }

  private requiredPawn(
    pawns: ReadonlyMap<string, PawnDefinition>,
    id: string,
  ): PawnDefinition {
    const pawn = pawns.get(id);
    if (!pawn) throw new Error(`Pawn definition '${id}' not found.`);
    return pawn;
  }

  private skillAssignments(
    ids: readonly string[],
    initialLevels: Readonly<Record<string, number>> | undefined,
    maximumLevels: Readonly<Record<string, number>> | undefined,
    catalog: ReadonlyMap<string, Skill>,
  ): ProductionSkillAssignment[] {
    return [...new Set(ids)].map(id => {
      const skill = catalog.get(id);
      const initialLevel = initialLevels?.[id] ?? (skill instanceof PawnSkill && skill.activationType === undefined ? 1 : 0);
      return {
        id,
        initialLevel,
        maxLevel: maximumLevels?.[id] ?? Math.max(1, initialLevel),
      };
    });
  }

  private toDocument(pawn: PawnDefinition, catalog: ReadonlyMap<string, Skill>): ProductionPawnDocument {
    const assignments = this.skillAssignments(pawn.skills.map(String).filter(id => id !== 'power-growth'), pawn.innateSkillLevels, pawn.maxSkillLevels, catalog);
    const isSoldier = pawn.stats instanceof SoldierPawnStats;
    const { powerBonusPerDecrement, ...skillParams } = pawn.implicitSkillParams ?? {};
    return {
      id: pawn.identity.id.value,
      ...(pawn.identity.displayName && { displayName: pawn.identity.displayName }),
      color: pawn.identity.color,
      type: pawn.identity.type,
      turnCount: pawn.stats.turnCount,
      power: isSoldier ? pawn.stats.power : {
        startPower: pawn.stats.power,
        ...(powerBonusPerDecrement !== undefined && powerBonusPerDecrement > 0 && { powerBonusPerDecrement }),
      },
      ...(!isSoldier && {
        countPawns: pawn.stats.countPawns,
        moveCount: pawn.stats.moveCount,
      }),
      ...(isSoldier && { nonePower: pawn.stats.nonePower }),
      visualKey: pawn.visual.visualKey,
      weaponKey: pawn.visual.weaponKey.value,
      ...(pawn.requiredInfluencePoints !== undefined && {
        requiredInfluencePoints: pawn.requiredInfluencePoints,
      }),
      ...(assignments.length > 0 && { skills: assignments }),
      ...(Object.keys(skillParams).length > 0 && { implicitSkillParams: skillParams }),
    };
  }
}
