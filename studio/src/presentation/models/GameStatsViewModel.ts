import type { RecordedGame, GameStatsFilters } from '@game-data/application';

export interface GameStatsPagination {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface GameStatsViewModel {
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly games: readonly RecordedGame[];
  readonly filters: GameStatsFilters;
  readonly pagination: GameStatsPagination;
  readonly detailStatus: 'idle' | 'loading' | 'ready' | 'error';
  readonly selectedGame?: RecordedGame;
  readonly error?: string;
  readonly detailError?: string;
}
