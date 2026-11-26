import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import {
  CreateCommander,
  CreateProductionGameDataProposal,
  GenerateProductionGameData,
  ListCommanders,
  ProductionGameDataValidator,
  UpdateCommander,
} from '@game-data/application';
import { JsonCommanderCatalogRepository } from '@game-data/infrastructure';
import {
  JsonCommanderPawnDefinitionRepository,
  JsonOfficerPawnDefinitionRepository,
  JsonSoldierPawnDefinitionRepository,
  JsonProductionCommanderCatalogRepository,
  JsonSkillCatalogRepository,
  JsonWallVisualSetCatalogRepository,
  JsonWeaponKeyCatalogRepository,
  GitProductionGameDataProposalGateway,
  JsonSavedGridRepository,
} from '@game-data/infrastructure';
import { CommanderCatalogApiHandler } from './vite/CommanderCatalogApiHandler.ts';
import { PawnCatalogApiHandler } from './vite/PawnCatalogApiHandler.ts';
import { PawnApiHandler } from './vite/PawnApiHandler.ts';
import { WallVisualSetApiHandler } from './vite/WallVisualSetApiHandler.ts';
import { PublishApiHandler } from './vite/PublishApiHandler.ts';
import { commanderCatalogApiPlugin } from './vite/commanderCatalogApiPlugin.ts';
import { SavedGridApiHandler } from './vite/SavedGridApiHandler.ts';
import { SkillCatalogApiHandler } from './vite/SkillCatalogApiHandler.ts';

const catalogPath = fileURLToPath(
  new URL('../../store/catalog/commanders.json', import.meta.url),
);
const repository = new JsonCommanderCatalogRepository(catalogPath);
const listCommanders = new ListCommanders(repository);
const handler = new CommanderCatalogApiHandler(
  new CreateCommander(repository),
  new UpdateCommander(repository),
  listCommanders,
);
const wallVisualSetHandler = new WallVisualSetApiHandler(
  fileURLToPath(new URL('../../../data/wallVisualSets.json', import.meta.url)),
);

const soldierRepo = new JsonSoldierPawnDefinitionRepository(
  fileURLToPath(new URL('../../store/catalog/soldierPawnDefinitions.json', import.meta.url)),
);
const commanderPawnRepo = new JsonCommanderPawnDefinitionRepository(
  fileURLToPath(new URL('../../store/catalog/commanderPawnDefinitions.json', import.meta.url)),
);
const officerPawnRepo = new JsonOfficerPawnDefinitionRepository(
  fileURLToPath(new URL('../../store/catalog/officerPawnDefinitions.json', import.meta.url)),
);
const pawnHandler = new PawnCatalogApiHandler([
  { role: 'soldier', repository: soldierRepo },
  { role: 'officer', repository: officerPawnRepo },
  { role: 'commander', repository: commanderPawnRepo },
]);
const pawnApiHandler = new PawnApiHandler(soldierRepo, officerPawnRepo, commanderPawnRepo);
const productionCommanderCatalogPath = fileURLToPath(
  new URL('../../../data/commanders.json', import.meta.url),
);
const skillCatalog = new JsonSkillCatalogRepository(fileURLToPath(new URL('../../../data/skills.json', import.meta.url)));
const productionCommanders = new JsonProductionCommanderCatalogRepository(productionCommanderCatalogPath);
const skillCatalogHandler = new SkillCatalogApiHandler(skillCatalog, async (id, maximum) => {
  const [pawns, commanders, production] = await Promise.all([
    pawnHandler.handle(), listCommanders.execute(), productionCommanders.findAll(),
  ]);
  const owners = [
    ...pawns.filter(pawn => 'skills' in pawn), ...commanders,
    ...production.flatMap(({ id, baseStats }) => [
      { id, ...baseStats }, ...(baseStats.officerPawns ?? []),
      ...(baseStats.commanderPawns ?? []), ...(baseStats.soldierPawns ?? []),
    ]),
  ];
  const blocked = owners.find(owner =>
    (owner.innateSkillLevels?.[id] ?? 0) > maximum
    || (owner.maxSkillLevels?.[id] ?? 0) > maximum
    || owner.skills?.some(skill => typeof skill !== 'string' && skill.id === id
      && Math.max(skill.initialLevel, skill.maxLevel) > maximum),
  );
  if (blocked) throw new Error(`Le niveau à supprimer est encore assigné à ${blocked.id}. Ajustez cette assignation avant de supprimer le niveau.`);
});
const generateProductionGameData = new GenerateProductionGameData(
  repository,
  soldierRepo,
  commanderPawnRepo,
  officerPawnRepo,
  productionCommanders,
  skillCatalog,
  new JsonWeaponKeyCatalogRepository(fileURLToPath(new URL('../../../data/weaponKeys.json', import.meta.url))),
  new JsonWallVisualSetCatalogRepository(fileURLToPath(new URL('../../../data/wallVisualSets.json', import.meta.url))),
  new ProductionGameDataValidator(),
);
const repositoryPath = fileURLToPath(new URL('../../../', import.meta.url));
const publishHandler = new PublishApiHandler(
  new CreateProductionGameDataProposal(
    generateProductionGameData,
    new GitProductionGameDataProposalGateway(repositoryPath),
  ),
);
const savedGridHandler = new SavedGridApiHandler(new JsonSavedGridRepository(fileURLToPath(new URL('../../store/grids.json', import.meta.url))));

const gameStatsTarget = process.env['GAME_STATS_SERVER_URL'] ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss(), commanderCatalogApiPlugin(handler, pawnHandler, pawnApiHandler, wallVisualSetHandler, publishHandler, savedGridHandler, skillCatalogHandler)],
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api/game-stats': {
        target: gameStatsTarget,
        changeOrigin: true,
      },
    },
  },
});
