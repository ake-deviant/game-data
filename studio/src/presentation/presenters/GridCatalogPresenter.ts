import type { GridCommanderItem, GridPawnTemplate } from '@game-data/application';

export interface GridCatalogViewModel {
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly commanders: readonly GridCommanderItem[];
  readonly selectedCommander?: GridCommanderItem;
  readonly pawns: readonly GridPawnTemplate[];
  readonly message?: string;
}

export class GridCatalogPresenter {
  private model: GridCatalogViewModel = { status: 'idle', commanders: [], pawns: [] };
  private readonly listeners = new Set<() => void>();
  public getViewModel = () => this.model;
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  public loading(): void {
    this.update({ status: 'loading', commanders: [], pawns: [] });
  }

  public loaded(commanders: readonly GridCommanderItem[]): void {
    this.update({ status: 'ready', commanders, pawns: [] });
  }

  public selected(commander: GridCommanderItem, pawns: readonly GridPawnTemplate[]): void {
    this.update({ status: 'ready', commanders: this.model.commanders, selectedCommander: commander, pawns });
  }

  public selectionError(message: string): void {
    this.update({ status: 'ready', commanders: this.model.commanders, pawns: [], message });
  }

  public loadError(): void {
    this.update({ status: 'error', commanders: [], pawns: [], message: 'Impossible de charger le catalogue interne. Réessayez.' });
  }

  private update(model: GridCatalogViewModel): void {
    this.model = model;
    this.listeners.forEach((listener) => listener());
  }
}
