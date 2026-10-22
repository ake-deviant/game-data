import type { RecordedGame, BotComparisonResult, GameStatus } from '@game-data/application';
import type { BotComparisonViewModel, BotMatchesPagination } from '../models/BotComparisonViewModel.ts';

const DEFAULT_PAGINATION: BotMatchesPagination = { page: 1, pageSize: 50, total: 0, totalPages: 0 };

export class BotComparisonPresenter {
  private model: BotComparisonViewModel = {
    botA: 'heuristic-v1',
    botB: 'heuristic-v2',
    comparisonStatus: 'idle',
    matchesStatus: 'idle',
    matches: [],
    matchesPagination: DEFAULT_PAGINATION,
  };
  private readonly listeners = new Set<() => void>();
  public getViewModel = () => this.model;
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  public loadingComparison(botA: string, botB: string): void {
    this.update({ ...this.model, botA, botB, comparisonStatus: 'loading', comparison: undefined, comparisonError: undefined });
  }

  public comparisonLoaded(comparison: BotComparisonResult): void {
    this.update({ ...this.model, comparisonStatus: 'ready', comparison, comparisonError: undefined });
  }

  public comparisonError(message: string): void {
    this.update({ ...this.model, comparisonStatus: 'error', comparisonError: message });
  }

  public loadingMatches(page: number, statusFilter?: GameStatus): void {
    this.update({ ...this.model, matchesStatus: 'loading', matches: [], matchesPagination: { ...this.model.matchesPagination, page }, matchesStatusFilter: statusFilter, matchesError: undefined });
  }

  public matchesLoaded(matches: readonly RecordedGame[], pagination: BotMatchesPagination): void {
    this.update({ ...this.model, matchesStatus: 'ready', matches, matchesPagination: pagination, matchesError: undefined });
  }

  public matchesError(message: string): void {
    this.update({ ...this.model, matchesStatus: 'error', matchesError: message });
  }

  private update(model: BotComparisonViewModel): void {
    this.model = model;
    this.listeners.forEach((l) => l());
  }
}
