import type { RecordedGame, GameStatsFilters } from '@game-data/application';
import type { GameStatsViewModel, GameStatsPagination } from '../models/GameStatsViewModel.ts';

const DEFAULT_PAGINATION: GameStatsPagination = { page: 1, pageSize: 50, total: 0, totalPages: 0 };
const DEFAULT_FILTERS: GameStatsFilters = { page: 1, pageSize: 50 };

export class GameStatsPresenter {
  private model: GameStatsViewModel = {
    status: 'idle',
    games: [],
    filters: DEFAULT_FILTERS,
    pagination: DEFAULT_PAGINATION,
    detailStatus: 'idle',
  };
  private readonly listeners = new Set<() => void>();
  public getViewModel = () => this.model;
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  public loadingGames(filters: GameStatsFilters): void {
    this.update({ ...this.model, status: 'loading', filters, games: [], selectedGame: undefined, detailStatus: 'idle', error: undefined });
  }

  public gamesLoaded(games: readonly RecordedGame[], pagination: GameStatsPagination, filters: GameStatsFilters): void {
    this.update({ ...this.model, status: 'ready', games, pagination, filters, error: undefined });
  }

  public gamesError(message: string): void {
    this.update({ ...this.model, status: 'error', games: [], error: message });
  }

  public loadingDetail(): void {
    this.update({ ...this.model, detailStatus: 'loading', selectedGame: undefined, detailError: undefined });
  }

  public detailLoaded(game: RecordedGame): void {
    this.update({ ...this.model, detailStatus: 'ready', selectedGame: game });
  }

  public detailError(message: string): void {
    this.update({ ...this.model, detailStatus: 'error', detailError: message });
  }

  public clearDetail(): void {
    this.update({ ...this.model, detailStatus: 'idle', selectedGame: undefined, detailError: undefined });
  }

  private update(model: GameStatsViewModel): void {
    this.model = model;
    this.listeners.forEach((l) => l());
  }
}
