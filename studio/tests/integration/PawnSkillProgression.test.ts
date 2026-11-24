import { describe, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { PawnSkill, type PawnDefinition } from '@game-data/domain';
import { PawnApiHandler } from '../../apps/web-react/vite/PawnApiHandler';
import { PawnCatalogApiHandler } from '../../apps/web-react/vite/PawnCatalogApiHandler';
import { JsonSkillCatalogRepository } from '../../src/infrastructure/json/JsonSkillCatalogRepository';
import { PawnDefinitionCatalogMapper } from '../../src/infrastructure/json/PawnDefinitionCatalogMapper';
import { pawnDefinitionCatalogItemSchema } from '../../src/infrastructure/json/PawnDefinitionCatalogDocument';
import { ProductionGameDataValidator } from '../../src/application/services/ProductionGameDataValidator';
import { ProductionCommanderCatalogMother } from '../fixtures/production/ProductionCommanderCatalogMother';
import { ProductionReferenceCatalogsMother } from '../fixtures/production/ProductionReferenceCatalogsMother';
import { CreatePawnDefinitionController } from '../../src/presentation/controllers/CreatePawnDefinitionController';
import { UpdatePawnDefinitionController } from '../../src/presentation/controllers/UpdatePawnDefinitionController';
import { createEmptyPawnDefinitionForm } from '../../src/presentation/models/PawnDefinitionFormModel';

const skillId = 'increase-power-column-when-decrementing';
const dataPath = (name: string) => fileURLToPath(new URL(`../../../data/${name}`, import.meta.url));

async function references() {
  const result = ProductionReferenceCatalogsMother.valid();
  const skill = (await new JsonSkillCatalogRepository(dataPath('skills.json')).findAll()).find(s => s.id.value === skillId)!;
  return { ...result, skills: [...result.skills, skill] };
}

describe('Pawn skill progression', () => {
  it('preserves the initial level and maximum when saving and listing an elite through HTTP', async () => {
    let stored: PawnDefinition | null = null;
    const repo = {
      findAll: async () => stored ? [stored] : [],
      findById: async () => stored,
      save: async (pawn: PawnDefinition) => { stored = pawn; },
      replace: async (_previousId: unknown, pawn: PawnDefinition) => { stored = pawn; },
    };
    const api = new PawnApiHandler(repo, repo, repo);
    const catalog = new PawnCatalogApiHandler([{ role: 'commander', repository: repo }]);
    const request = {
      ...ProductionCommanderCatalogMother.valid()[0].baseStats.commanderPawns[0],
      role: 'commander',
      skills: [skillId],
      innateSkillLevels: { [skillId]: 1 },
      maxSkillLevels: { [skillId]: 2 },
    };
    expect((await api.handleCreate(request)).status).toBe(201);
    expect(await catalog.handle()).toMatchObject([{
      innateSkillLevels: { [skillId]: 1 }, maxSkillLevels: { [skillId]: 2 },
    }]);

    expect((await api.handleUpdate({ ...request, innateSkillLevels: { [skillId]: 0 } })).status).toBe(200);
    expect(await catalog.handle()).toMatchObject([{
      innateSkillLevels: { [skillId]: 0 }, maxSkillLevels: { [skillId]: 2 },
    }]);
  });

  it('defines total bonuses 3, 7, 12 and the agreed purchase requirements', async () => {
    const skill = (await references()).skills.find(s => s.id.value === skillId);
    expect(skill).toBeInstanceOf(PawnSkill);
    expect((skill as PawnSkill).activationType).toBe('progressive');
    expect((skill as PawnSkill).levels.map(level => [level.skillPointCost, level.requiredInfluencePoints, level.implicitSkillParams['columnPowerBonusPerDecrement']]))
      .toEqual([[3, 3, 3], [5, 12, 7], [15, 25, 12]]);
  });

  it.each([0, 1, 2, 3])('preserves innate level %i through the JSON schema and entity mapper', level => {
    const document = pawnDefinitionCatalogItemSchema.parse({
      ...ProductionCommanderCatalogMother.valid()[0].baseStats.commanderPawns[0],
      skills: [skillId], innateSkillLevels: { [skillId]: level },
    });
    const mapper = new PawnDefinitionCatalogMapper();
    const updated = pawnDefinitionCatalogItemSchema.parse(mapper.toDocument(mapper.toDomain(document)));
    expect(updated.skills).toEqual([{ id: skillId, initialLevel: level }]);
    expect(mapper.toDomain(updated).innateSkillLevels).toEqual({ [skillId]: level });
  });

  it.each([0, 1, 2, 3])('accepts a production pawn with innate level %i', async level => {
    const catalog = ProductionCommanderCatalogMother.valid();
    Object.assign(catalog[0].baseStats.commanderPawns[0], { skills: [skillId], innateSkillLevels: { [skillId]: level } });
    const refs = await references();
    expect(() => new ProductionGameDataValidator().validate(catalog, refs)).not.toThrow();
  });

  it.each([-1, 1.5, 4])('rejects an invalid innate level %s', async level => {
    const catalog = ProductionCommanderCatalogMother.valid();
    Object.assign(catalog[0].baseStats.commanderPawns[0], { skills: [skillId], innateSkillLevels: { [skillId]: level } });
    const refs = await references();
    expect(() => new ProductionGameDataValidator().validate(catalog, refs)).toThrow('Invalid innate skill level');
  });

  it.each([
    { initial: 0, maximum: 1, valid: true },
    { initial: 1, maximum: 2, valid: true },
    { initial: 3, maximum: 3, valid: true },
    { initial: 3, maximum: 2, valid: false },
  ])('validates an elite with innate level $initial and assigned maximum $maximum', async ({ initial, maximum, valid }) => {
    const catalog = ProductionCommanderCatalogMother.valid();
    Object.assign(catalog[0].baseStats.commanderPawns[0], {
      skills: [{ id: skillId, initialLevel: initial, maxLevel: maximum }],
      implicitSkillParams: { powerBonusPerDecrement: 10, freeWallDestructsOnDecrement: 1 },
    });
    const refs = await references();
    const validate = () => new ProductionGameDataValidator().validate(catalog, refs);
    if (valid) expect(validate).not.toThrow();
    else expect(validate).toThrow('Invalid innate skill level');
  });

  it.each([0, 1])('the create and update forms transmit innate level %i and discard deselected skills', async level => {
    const form = { ...createEmptyPawnDefinitionForm(), role: 'commander' as const, skills: [skillId],
      innateSkillLevels: { [skillId]: level, removed: 2 } };
    const presenter = { presentSaving: vi.fn(), presentSuccess: vi.fn(), presentError: vi.fn() };
    const create = { execute: vi.fn().mockResolvedValue({ id: 'pawn' }) };
    const update = { execute: vi.fn().mockResolvedValue({ id: 'pawn' }) };
    await new CreatePawnDefinitionController(create, presenter).submit(form);
    await new UpdatePawnDefinitionController(update, presenter).submit(form);
    for (const action of [create, update]) expect(action.execute).toHaveBeenCalledWith(expect.objectContaining({ innateSkillLevels: { [skillId]: level } }));
  });
});
