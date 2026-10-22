import type { RecordedGame, BotComparisonResult, GameStatus } from '@game-data/application';

export interface BotMatchesPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface BotComparisonViewModel {
  readonly botA: string;
  readonly botB: string;
  readonly comparisonStatus: 'idle' | 'loading' | 'ready' | 'error';
  readonly comparison?: BotComparisonResult;
  readonly comparisonError?: string;
  readonly matchesStatus: 'idle' | 'loading' | 'ready' | 'error';
  readonly matches: readonly RecordedGame[];
  readonly matchesPagination: BotMatchesPagination;
  readonly matchesStatusFilter?: GameStatus;
  readonly matchesError?: string;
}
