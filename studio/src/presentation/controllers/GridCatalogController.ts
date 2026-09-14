import type { GridCatalog, LoadGridCatalog, SelectGridCommander } from '@game-data/application';
import type { GridCatalogPresenter } from '../presenters/GridCatalogPresenter.ts';

export class GridCatalogController {
  private catalog?: GridCatalog;
  private loadVersion = 0;

  public constructor(
    private readonly loadCatalog: Pick<LoadGridCatalog, 'execute'>,
    private readonly selectCommander: Pick<SelectGridCommander, 'execute'>,
    private readonly presenter: GridCatalogPresenter,
  ) {}

  public async load(): Promise<void> {
    const version = ++this.loadVersion;
    this.catalog = undefined;
    this.presenter.loading();
    try {
      const catalog = await this.loadCatalog.execute();
      if (version !== this.loadVersion) return;
      this.catalog = catalog;
      this.presenter.loaded(catalog.commanders);
    } catch {
      if (version === this.loadVersion) this.presenter.loadError();
    }
  }

  public select(commanderId: string): void {
    if (!this.catalog) return;
    if (!commanderId) {
      this.presenter.loaded(this.catalog.commanders);
      return;
    }
    try {
      const result = this.selectCommander.execute(this.catalog, commanderId);
      this.presenter.selected(result.commander, result.pawns);
    } catch (error) {
      this.presenter.selectionError(error instanceof Error ? error.message : 'Impossible de sélectionner ce commandant.');
    }
  }
}
