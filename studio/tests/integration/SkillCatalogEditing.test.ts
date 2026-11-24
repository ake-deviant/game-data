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
