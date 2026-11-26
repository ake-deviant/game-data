import { mkdtemp, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { SkillCatalogApiHandler } from '../../apps/web-react/vite/SkillCatalogApiHandler';
import { PawnSkillMother } from '../fixtures/domain/PawnSkillMother';
import { JsonSkillCatalogRepository } from '../../src/infrastructure/json/JsonSkillCatalogRepository';

it('validates and persists both purchase requirements without changing the other skill fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'studio-skills-test-'));
  const file = join(directory, 'skills.json');
  const fixture = PawnSkillMother.liaisonWithoutPurchaseDocument();
  const { id } = fixture;
  try {
    await writeFile(file, JSON.stringify({ pawnSkillVisuals: [fixture], activablePlayerSkills: [] }), 'utf8');
    const repository = new JsonSkillCatalogRepository(file);
    const api = new SkillCatalogApiHandler(repository);
    const original = await readFile(file, 'utf8');
    const request = {
      id,
      levels: [{ level: 1, values: { skillPointCost: 4 }, implicitSkillParams: {} }],
    };

    expect((await api.handleUpdate(request)).status).toBe(422);
    expect(await readFile(file, 'utf8')).toBe(original);

    const values = { skillPointCost: 4, requiredInfluencePoints: 7 };
    const response = await api.handleUpdate({ ...request, levels: [{ ...request.levels[0], values }] });
    expect(response.status).toBe(200);

    const expected = JSON.parse(original);
    const skill = expected.pawnSkillVisuals.find((entry: { id: string }) => entry.id === id);
    Object.assign(skill.levels[0], values);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(expected);
  } finally {
    await rm(file, { force: true });
    await rmdir(directory);
  }
});

it('rend Synergie de Liaison progressive et protège ses assignations', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'studio-skills-levels-'));
  const file = join(directory, 'skills.json');
  const fixture = {
    ...PawnSkillMother.liaisonWithoutPurchaseDocument(),
    id: 'liaison-power-bonus',
    descriptionParams: { liaisonBonusPercent: 'pawn.implicitSkillParams.liaisonBonusPercent' },
    levels: [{ level: 1, implicitSkillParams: { liaisonBonusPercent: 10 } }],
  };
  let assignedMaximum = 2;
  try {
    await writeFile(file, JSON.stringify({ pawnSkillVisuals: [fixture], activablePlayerSkills: [] }));
    const repository = new JsonSkillCatalogRepository(file);
    const api = new SkillCatalogApiHandler(repository, async (id, maximum) => {
      expect(id).toBe(fixture.id);
      if (assignedMaximum > maximum) throw new Error('Niveau encore assigné.');
    });
    const first = { level: 1, values: {}, implicitSkillParams: { liaisonBonusPercent: 10 } };
    const second = { ...first, level: 2, implicitSkillParams: { liaisonBonusPercent: 20 } };
    const addition = { id: fixture.id, expectedLevelCount: 1, levels: [first, second] };
    expect((await api.handleUpdate(addition)).status).toBe(200);
    expect((await api.handleUpdate(addition)).status).toBe(422);
    const [saved] = (await repository.readDocument()).pawnSkillVisuals;
    expect(saved.activationType).toBe('progressive');
    expect(saved.levels).toMatchObject([first, second].map(
      ({ level, implicitSkillParams }) => ({ level, implicitSkillParams }),
    ));
    const removal = { ...addition, expectedLevelCount: 2, levels: [first] };
    expect((await api.handleUpdate(removal)).status).toBe(422);
    expect((await repository.readDocument()).pawnSkillVisuals[0].levels).toHaveLength(2);
    assignedMaximum = 1;
    expect((await api.handleUpdate(removal)).status).toBe(200);
    expect((await repository.readDocument()).pawnSkillVisuals[0].levels).toHaveLength(1);
  } finally {
    await rm(file, { force: true });
    await rmdir(directory);
  }
});
