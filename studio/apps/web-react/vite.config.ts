import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { CreateCommander, UpdateCommander, ListCommanders } from '@game-data/application';
import { JsonCommanderCatalogRepository } from '@game-data/infrastructure';
import {
  JsonCommanderPawnDefinitionRepository,
  JsonOfficerPawnDefinitionRepository,
  JsonSoldierPawnDefinitionRepository,
} from '@game-data/infrastructure';
import { CommanderCatalogApiHandler } from './vite/CommanderCatalogApiHandler.ts';
import { PawnCatalogApiHandler } from './vite/PawnCatalogApiHandler.ts';
import { PawnApiHandler } from './vite/PawnApiHandler.ts';
import { WallVisualSetApiHandler } from './vite/WallVisualSetApiHandler.ts';
import { PublishApiHandler } from './vite/PublishApiHandler.ts';
import { commanderCatalogApiPlugin } from './vite/commanderCatalogApiPlugin.ts';

const catalogPath = fileURLToPath(
  new URL('../../store/catalog/commanders.json', import.meta.url),
);
const repository = new JsonCommanderCatalogRepository(catalogPath);
const handler = new CommanderCatalogApiHandler(
  new CreateCommander(repository),
  new UpdateCommander(repository),
  new ListCommanders(repository),
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
const publishHandler = new PublishApiHandler(
  new ListCommanders(repository),
  soldierRepo,
  commanderPawnRepo,
  officerPawnRepo,
  fileURLToPath(new URL('../../../data/commanders.json', import.meta.url)),
);

export default defineConfig({
  plugins: [react(), tailwindcss(), commanderCatalogApiPlugin(handler, pawnHandler, pawnApiHandler, wallVisualSetHandler, publishHandler)],
  server: { host: '127.0.0.1', port: 5174 },
});
