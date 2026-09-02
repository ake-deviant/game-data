import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { SoldierPawnStats } from '@game-data/domain';
import type { PawnDefinition } from '@game-data/domain';
import type { PawnDefinitionRepository } from '@game-data/application';
import type { ListCommanders, CommanderListItem } from '@game-data/application';

interface ProductionPawnDoc {
  id: string;
  displayName?: string;
  color: string;
  type: string;
  turnCount: number;
  power: number;
  countPawns?: number;
  moveCount?: number;
  nonePower?: number;
  visualKey: string;
  weaponKey: string;
  requiredInfluencePoints?: number;
  skills?: readonly string[];
  implicitSkillParams?: Record<string, number>;
}

interface ProductionBaseStats {
  pawnMax: number;
  health: number;
  maxDefenseLevel: number;
  wallVisualSet: string;
  defensePowerPerLevel: number;
  movementsPerTurn: number;
  soldierPawns: ProductionPawnDoc[];
  commanderPawns: ProductionPawnDoc[];
  officerPawns: ProductionPawnDoc[];
  skills?: readonly string[];
  innateSkills?: readonly string[];
  freeRecruitThreshold?: number;
}

interface ProductionCommanderDoc {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  baseStats: ProductionBaseStats;
}

export interface PublishResult {
  published: { id: string; name: string }[];
}

export class PublishApiHandler {
  private readonly listCommanders: Pick<ListCommanders, 'execute'>;
  private readonly soldierRepo: PawnDefinitionRepository;
  private readonly commanderPawnRepo: PawnDefinitionRepository;
  private readonly officerPawnRepo: PawnDefinitionRepository;
  private readonly productionCatalogPath: string;

  public constructor(
    listCommanders: Pick<ListCommanders, 'execute'>,
    soldierRepo: PawnDefinitionRepository,
    commanderPawnRepo: PawnDefinitionRepository,
    officerPawnRepo: PawnDefinitionRepository,
    productionCatalogPath: string,
  ) {
    this.listCommanders = listCommanders;
    this.soldierRepo = soldierRepo;
    this.commanderPawnRepo = commanderPawnRepo;
    this.officerPawnRepo = officerPawnRepo;
    this.productionCatalogPath = productionCatalogPath;
  }

  public async handle(input: unknown): Promise<{ status: number; body: PublishResult | { error: string } }> {
    const commanderIds = this.parseIds(input);
    if (!commanderIds) return { status: 400, body: { error: 'Le corps doit contenir un tableau commanderIds de chaînes non vides.' } };

    const allCommanders = await this.listCommanders.execute();
    const selected = allCommanders.filter((c) => commanderIds.includes(c.id));
    const missing = commanderIds.filter((id) => !allCommanders.find((c) => c.id === id));
    if (missing.length > 0) return { status: 404, body: { error: `Commanders introuvables dans le catalogue : ${missing.join(', ')}.` } };

    const [soldierMap, commanderPawnMap, officerPawnMap] = await Promise.all([
      this.loadDefinitions(this.soldierRepo),
      this.loadDefinitions(this.commanderPawnRepo),
      this.loadDefinitions(this.officerPawnRepo),
    ]);

    const productionDocs: ProductionCommanderDoc[] = [];
    for (const commander of selected) {
      const result = this.buildProductionDoc(commander, soldierMap, commanderPawnMap, officerPawnMap);
      if ('error' in result) return { status: 422, body: result };
      productionDocs.push(result);
    }

    await this.upsert(productionDocs);
    return { status: 200, body: { published: productionDocs.map((d) => ({ id: d.id, name: d.name })) } };
  }

  private parseIds(input: unknown): string[] | null {
    if (typeof input !== 'object' || input === null) return null;
    const { commanderIds } = input as Record<string, unknown>;
    if (!Array.isArray(commanderIds) || commanderIds.length === 0) return null;
    if (commanderIds.some((id) => typeof id !== 'string' || id.trim().length === 0)) return null;
    return commanderIds as string[];
  }

  private async loadDefinitions(repo: PawnDefinitionRepository): Promise<Map<string, PawnDefinition>> {
    const defs = await repo.findAll();
    return new Map(defs.map((d) => [d.identity.id.value, d]));
  }

  private buildProductionDoc(
    commander: CommanderListItem,
    soldierMap: Map<string, PawnDefinition>,
    commanderPawnMap: Map<string, PawnDefinition>,
    officerPawnMap: Map<string, PawnDefinition>,
  ): ProductionCommanderDoc | { error: string } {
    const soldierDocs: ProductionPawnDoc[] = [];
    for (const color of ['red', 'blue', 'green'] as const) {
      const id = commander.pawnDefinitionIdByColor[color];
      const def = soldierMap.get(id);
      if (!def) return { error: `Définition de soldier introuvable : ${id}.` };
      soldierDocs.push(this.toProductionPawn(def));
    }

    const commanderPawnDocs: ProductionPawnDoc[] = [];
    for (const id of commander.commanderPawnDefinitionIds) {
      const def = commanderPawnMap.get(id);
      if (!def) return { error: `Définition de commander pawn introuvable : ${id}.` };
      commanderPawnDocs.push(this.toProductionPawn(def));
    }

    const officerPawnDocs: ProductionPawnDoc[] = [];
    for (const id of commander.officerPawnDefinitionIds) {
      const def = officerPawnMap.get(id);
      if (!def) return { error: `Définition d'officer pawn introuvable : ${id}.` };
      officerPawnDocs.push(this.toProductionPawn(def));
    }

    const baseStats: ProductionBaseStats = {
      pawnMax: commander.pawnMax,
      health: commander.health,
      maxDefenseLevel: commander.maxDefenseLevel,
      wallVisualSet: commander.wallVisualSet,
      defensePowerPerLevel: commander.defensePowerPerLevel,
      movementsPerTurn: commander.movementsPerTurn,
      soldierPawns: soldierDocs,
      commanderPawns: commanderPawnDocs,
      officerPawns: officerPawnDocs,
      ...(commander.skills && commander.skills.length > 0 && { skills: commander.skills }),
      ...(commander.innateSkills && commander.innateSkills.length > 0 && { innateSkills: commander.innateSkills }),
      ...(commander.freeRecruitThreshold !== undefined && { freeRecruitThreshold: commander.freeRecruitThreshold }),
    };

    return {
      id: commander.id,
      name: commander.name,
      ...(commander.description && { description: commander.description }),
      ...(commander.icon && { icon: commander.icon }),
      baseStats,
    };
  }

  private toProductionPawn(def: PawnDefinition): ProductionPawnDoc {
    const isSoldier = def.stats instanceof SoldierPawnStats;
    const implicitSkillParams = def.implicitSkillParams;
    return {
      id: def.identity.id.value,
      ...(def.identity.displayName && { displayName: def.identity.displayName }),
      color: def.identity.color,
      type: def.identity.type,
      turnCount: def.stats.turnCount,
      power: def.stats.power,
      ...(!isSoldier && {
        countPawns: (def.stats as { countPawns: number }).countPawns,
        moveCount: (def.stats as { moveCount: number }).moveCount,
      }),
      ...(isSoldier && { nonePower: (def.stats as SoldierPawnStats).nonePower }),
      visualKey: def.visual.visualKey,
      weaponKey: def.visual.weaponKey.value,
      ...(def.requiredInfluencePoints !== undefined && { requiredInfluencePoints: def.requiredInfluencePoints }),
      ...(def.skills.length > 0 && { skills: def.skills.map((s) => s.value) }),
      ...(implicitSkillParams && { implicitSkillParams }),
    };
  }

  private async upsert(docs: ProductionCommanderDoc[]): Promise<void> {
    let existing: unknown[] = [];
    try {
      existing = JSON.parse(await readFile(this.productionCatalogPath, 'utf8')) as unknown[];
    } catch { /* fichier absent = on crée */ }

    const catalog = [...existing];
    for (const doc of docs) {
      const idx = catalog.findIndex(
        (c) => typeof c === 'object' && c !== null && (c as Record<string, unknown>)['id'] === doc.id,
      );
      if (idx === -1) catalog.push(doc);
      else catalog[idx] = doc;
    }

    const tmpPath = `${this.productionCatalogPath}.${randomUUID()}.tmp`;
    await mkdir(dirname(this.productionCatalogPath), { recursive: true });
    try {
      await writeFile(tmpPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
      await rename(tmpPath, this.productionCatalogPath);
    } catch (error) {
      await rm(tmpPath, { force: true });
      throw error;
    }
  }
}
