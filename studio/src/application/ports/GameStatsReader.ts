export type GameMode =
  | 'local'
  | 'online'
  | 'human-vs-bot'
  | 'bot-vs-bot'
  | 'tutorial'
  | 'restored'
  | 'unknown';

export type GameStatus = 'in-progress' | 'finished' | 'interrupted';
export type GameReason = 'combat' | 'forfeit' | 'removed' | null;

export interface RecordedParticipant {
  readonly playerId: string;
  readonly commanderId: string;
  readonly commanderName: string | null;
  readonly controller: 'human' | 'bot' | 'unknown';
  readonly botId: string | null;
  readonly healthPoints: number;
  readonly rawHealthPoints: number | null;
}

export interface RecordedGame {
  readonly gameId: string;
  readonly mode: GameMode;
  readonly status: GameStatus;
  readonly reason: GameReason;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly endedAt: string | null;
  readonly durationMinutes: number | null;
  readonly turnCount: number;
  readonly players: readonly [RecordedParticipant, RecordedParticipant];
  readonly result:
    | { readonly outcome: 'win'; readonly winnerId: string; readonly loserId: string }
    | { readonly outcome: 'draw' }
    | null;
}

export interface GameStatsFilters {
  readonly mode?: GameMode;
  readonly status?: GameStatus;
  readonly botA?: string;
  readonly botB?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface GameStatsPage {
  readonly items: readonly RecordedGame[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface BotStats {
  readonly botId: string;
  readonly wins: number;
  readonly losses: number;
  readonly winRatePercent: number | null;
  readonly decisiveWinRatePercent: number | null;
}

export interface BotComparisonResult {
  readonly mode: 'bot-vs-bot';
  readonly totalGames: number;
  readonly finishedGames: number;
  readonly decidedGames: number;
  readonly inProgressGames: number;
  readonly interruptedGames: number;
  readonly draws: number;
  readonly bots: readonly [BotStats, BotStats];
}

export interface GameStatsReader {
  listGames(filters: GameStatsFilters): Promise<GameStatsPage>;
  getGame(gameId: string): Promise<RecordedGame>;
  compareBots(botA: string, botB: string): Promise<BotComparisonResult>;
}
