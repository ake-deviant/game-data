import { CommanderNotFoundError } from '@game-data/application';
import type { UpdateCommanderResult } from '@game-data/application';

export type UpdateCommanderStatus = 'idle' | 'saving' | 'success' | 'error';

export interface UpdateCommanderViewModel {
  readonly status: UpdateCommanderStatus;
  readonly message: string | null;
}

type ViewModelListener = () => void;

export class UpdateCommanderPresenter {
  private viewModel: UpdateCommanderViewModel = { status: 'idle', message: null };
  private readonly listeners = new Set<ViewModelListener>();

  public getViewModel = (): UpdateCommanderViewModel => this.viewModel;

  public subscribe = (listener: ViewModelListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public presentSaving(): void {
    this.update({ status: 'saving', message: null });
  }

  public presentSuccess(result: UpdateCommanderResult): void {
    this.update({
      status: 'success',
      message: `Le Commander « ${result.name} » a été mis à jour dans le catalogue interne.`,
    });
  }

  public presentError(error: unknown): void {
    const message = error instanceof CommanderNotFoundError
      ? 'Ce Commander est introuvable dans le catalogue interne.'
      : "Le Commander n'a pas pu être mis à jour.";
    this.update({ status: 'error', message });
  }

  private update(viewModel: UpdateCommanderViewModel): void {
    this.viewModel = viewModel;
    this.listeners.forEach((listener) => listener());
  }
}
