import { z } from 'zod';
import type { GameStatsReader, GameStatsFilters, GameStatsPage, RecordedGame, BotComparisonResult } from '@game-data/application';

const participantSchema = z.object({
  playerId: z.string(),
  commanderId: z.string(),
  commanderName: z.string().nullable(),
  controller: z.enum(['human', 'bot', 'unknown']),
  botId: z.string().nullable(),
  healthPoints: z.number(),
  rawHealthPoints: z.number().nullable(),
});

const recordedGameSchema = z.object({
  gameId: z.string(),
  mode: z.enum(['local', 'online', 'human-vs-bot', 'bot-vs-bot', 'tutorial', 'restored', 'unknown']),
  status: z.enum(['in-progress', 'finished', 'interrupted']),
  reason: z.enum(['combat', 'forfeit', 'removed']).nullable(),
  startedAt: z.string(),
  updatedAt: z.string(),
  endedAt: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  turnCount: z.number().int(),
  players: z.tuple([participantSchema, participantSchema]),
  result: z.union([
    z.object({ outcome: z.literal('win'), winnerId: z.string(), loserId: z.string() }),
    z.object({ outcome: z.literal('draw') }),
  ]).nullable(),
});

const pageSchema = z.object({
  items: z.array(recordedGameSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

const botStatsSchema = z.object({
  botId: z.string(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  winRatePercent: z.number().nullable(),
  decisiveWinRatePercent: z.number().nullable(),
});

const comparisonSchema = z.object({
  mode: z.literal('bot-vs-bot'),
  totalGames: z.number().int().nonnegative(),
  finishedGames: z.number().int().nonnegative(),
  decidedGames: z.number().int().nonnegative(),
  inProgressGames: z.number().int().nonnegative(),
  interruptedGames: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  bots: z.tuple([botStatsSchema, botStatsSchema]),
});

export class HttpGameStatsReader implements GameStatsReader {
  public async listGames(filters: GameStatsFilters): Promise<GameStatsPage> {
    const params = new URLSearchParams();
    if (filters.mode !== undefined) params.set('mode', filters.mode);
    if (filters.status !== undefined) params.set('status', filters.status);
    if (filters.botA !== undefined) params.set('botA', filters.botA);
    if (filters.botB !== undefined) params.set('botB', filters.botB);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
    const data = await this.get(`/api/game-stats?${params.toString()}`);
    return pageSchema.parse(data);
  }

  public async getGame(gameId: string): Promise<RecordedGame> {
    const data = await this.get(`/api/game-stats/${encodeURIComponent(gameId)}`);
    return recordedGameSchema.parse(data);
  }

  public async compareBots(botA: string, botB: string): Promise<BotComparisonResult> {
    const params = new URLSearchParams({ botA, botB });
    const data = await this.get(`/api/game-stats/bots/compare?${params.toString()}`);
    return comparisonSchema.parse(data);
  }

  private async get(url: string): Promise<unknown> {
    const response = await fetch(url);
    const json = await response.json() as { success: boolean; data?: unknown; error?: { code: string; message: string } };
    if (!response.ok || !json.success) {
      throw new Error(json.error?.message ?? 'Erreur serveur inattendue.');
    }
    return json.data;
  }
}
