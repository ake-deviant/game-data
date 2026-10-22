import type { ListRecordedGames, GetRecordedGame, GameStatsFilters } from '@game-data/application';
import type { GameStatsPresenter } from '../presenters/GameStatsPresenter.ts';
import type { GameStatsPagination } from '../models/GameStatsViewModel.ts';

export class GameStatsController {
  private listVersion = 0;
  private detailVersion = 0;

  public constructor(
    private readonly listGames: Pick<ListRecordedGames, 'execute'>,
    private readonly getGame: Pick<GetRecordedGame, 'execute'>,
    private readonly presenter: GameStatsPresenter,
  ) {}

  public async load(filters: GameStatsFilters = { page: 1, pageSize: 50 }): Promise<void> {
    const version = ++this.listVersion;
    this.presenter.loadingGames(filters);
    try {
      const result = await this.listGames.execute(filters);
      if (version !== this.listVersion) return;
      const pagination: GameStatsPagination = {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      };
      this.presenter.gamesLoaded(result.items, pagination, filters);
    } catch {
      if (version === this.listVersion) {
        this.presenter.gamesError('Impossible de charger les parties. Vérifiez que le serveur est accessible.');
      }
    }
  }

  public async select(gameId: string): Promise<void> {
    const version = ++this.detailVersion;
    this.presenter.loadingDetail();
    try {
      const game = await this.getGame.execute(gameId);
      if (version !== this.detailVersion) return;
      this.presenter.detailLoaded(game);
    } catch {
      if (version === this.detailVersion) {
        this.presenter.detailError('Impossible de charger le détail de cette partie.');
      }
    }
  }

  public clearDetail(): void {
    this.presenter.clearDetail();
  }

  public async refresh(): Promise<void> {
    await this.load(this.presenter.getViewModel().filters);
  }
}
