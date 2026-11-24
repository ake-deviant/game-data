import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { CommanderCatalogApiHandler } from './CommanderCatalogApiHandler.ts';
import type { PawnCatalogApiHandler } from './PawnCatalogApiHandler.ts';
import type { PawnApiHandler } from './PawnApiHandler.ts';
import type { WallVisualSetApiHandler } from './WallVisualSetApiHandler.ts';
import type { PublishApiHandler } from './PublishApiHandler.ts';
import type { SavedGridApiHandler } from './SavedGridApiHandler.ts';
import type { SkillCatalogApiHandler } from './SkillCatalogApiHandler.ts';

const ENDPOINT = '/api/catalog/commanders';
const PAWNS_ENDPOINT = '/api/catalog/pawns';
const WALL_VISUAL_SETS_ENDPOINT = '/api/catalog/wall-visual-sets';
const PUBLISH_ENDPOINT = '/api/catalog/publish';

export function commanderCatalogApiPlugin(
  handler: CommanderCatalogApiHandler,
  pawnHandler: PawnCatalogApiHandler,
  pawnApiHandler: PawnApiHandler,
  wallVisualSetHandler: WallVisualSetApiHandler,
  publishHandler: PublishApiHandler,
  savedGridHandler: SavedGridApiHandler,
  skillCatalogHandler: SkillCatalogApiHandler,
): Plugin {
  const middleware = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    if (request.url === '/api/catalog/skills' && (request.method === 'GET' || request.method === 'PUT')) {
      response.setHeader('content-type', 'application/json; charset=utf-8');
      try {
        const result = request.method === 'GET'
          ? await skillCatalogHandler.handleList()
          : await skillCatalogHandler.handleUpdate(JSON.parse(await readBody(request)));
        response.statusCode = result.status;
        response.end(JSON.stringify(result.body));
      } catch (error) {
        response.statusCode = error instanceof SyntaxError && request.method === 'PUT' ? 400 : 500;
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to read the skill catalog.' }));
      }
      return;
    }
    if (request.url === PUBLISH_ENDPOINT && request.method === 'POST') {
      try {
        const body = JSON.parse(await readBody(request));
        const result = await publishHandler.handle(body);
        response.statusCode = result.status;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(result.body));
      } catch {
        response.statusCode = 400;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ error: 'Invalid JSON body.' }));
      }
      return;
    }
    if (request.url === '/api/grids' && request.method === 'GET') {
      const result = await savedGridHandler.handleList(); response.statusCode = result.status; response.setHeader('content-type', 'application/json; charset=utf-8'); response.end(JSON.stringify(result.body)); return;
    }
    if (request.url === '/api/grids' && request.method === 'POST') {
      try { const result = await savedGridHandler.handleSave(JSON.parse(await readBody(request))); response.statusCode = result.status; response.setHeader('content-type', 'application/json; charset=utf-8'); response.end(result.body ? JSON.stringify(result.body) : ''); } catch { response.statusCode = 400; response.end(JSON.stringify({ error: 'Invalid JSON body.' })); } return;
    }
    if (request.url?.startsWith('/api/grids/') && request.method === 'DELETE') {
      const result = await savedGridHandler.handleDelete(decodeURIComponent(request.url.slice('/api/grids/'.length))); response.statusCode = result.status; response.end(); return;
    }
    if (request.url === PAWNS_ENDPOINT && request.method === 'GET') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(await pawnHandler.handle()));
      return;
    }
    if (request.url === PAWNS_ENDPOINT && (request.method === 'POST' || request.method === 'PUT')) {
      try {
        const body = JSON.parse(await readBody(request));
        const result = request.method === 'PUT'
          ? await pawnApiHandler.handleUpdate(body)
          : await pawnApiHandler.handleCreate(body);
        response.statusCode = result.status;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(result.body));
      } catch {
        response.statusCode = 400;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ error: 'Invalid JSON body.' }));
      }
      return;
    }
    if (request.url === WALL_VISUAL_SETS_ENDPOINT && request.method === 'GET') {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(await wallVisualSetHandler.handle()));
      return;
    }
    if (request.url === ENDPOINT && request.method === 'GET') {
      const result = await handler.handleList();
      response.statusCode = result.status;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(result.body));
      return;
    }
    if (request.url !== ENDPOINT) {
      next();
      return;
    }

    try {
      const body = JSON.parse(await readBody(request));
      const result = request.method === 'PUT'
        ? await handler.handleUpdate(body)
        : await handler.handleCreate(body);
      response.statusCode = result.status;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(result.body));
    } catch {
      response.statusCode = 400;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ error: 'Invalid JSON body.' }));
    }
  };

  return {
    name: 'commander-catalog-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}
