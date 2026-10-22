import type { CompareBots, ListRecordedGames, GameStatus } from '@game-data/application';
import type { BotComparisonPresenter } from '../presenters/BotComparisonPresenter.ts';
import type { BotMatchesPagination } from '../models/BotComparisonViewModel.ts';

export class BotComparisonController {
  private compareVersion = 0;
  private matchesVersion = 0;

  public constructor(
    private readonly compareBots: Pick<CompareBots, 'execute'>,
    private readonly listGames: Pick<ListRecordedGames, 'execute'>,
    private readonly presenter: BotComparisonPresenter,
  ) {}

  public async compare(botA: string, botB: string): Promise<void> {
    const version = ++this.compareVersion;
    this.presenter.loadingComparison(botA, botB);
    try {
      const result = await this.compareBots.execute(botA, botB);
      if (version !== this.compareVersion) return;
      this.presenter.comparisonLoaded(result);
    } catch {
      if (version === this.compareVersion) {
        this.presenter.comparisonError('Impossible de charger la comparaison. Vérifiez que le serveur est accessible.');
      }
    }
  }

  public async loadMatches(page = 1, statusFilter?: GameStatus): Promise<void> {
    const { botA, botB } = this.presenter.getViewModel();
    const version = ++this.matchesVersion;
    this.presenter.loadingMatches(page, statusFilter);
    try {
      const result = await this.listGames.execute({
        botA,
        botB,
        page,
        pageSize: 50,
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
      });
      if (version !== this.matchesVersion) return;
      const pagination: BotMatchesPagination = {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      };
      this.presenter.matchesLoaded(result.items, pagination);
    } catch {
      if (version !== this.matchesVersion) return;
      this.presenter.matchesError('Impossible de charger les confrontations.');
    }
  }

  public async refresh(): Promise<void> {
    const { botA, botB, matchesPagination, matchesStatusFilter } = this.presenter.getViewModel();
    if (botA === botB) return;
    await Promise.all([
      this.compare(botA, botB),
      this.loadMatches(matchesPagination.page, matchesStatusFilter),
    ]);
  }
}
