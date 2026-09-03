import { PawnDefinitionNotFoundError } from '@game-data/application';
import type { UpdatePawnDefinitionResult } from '@game-data/application';

export type UpdatePawnDefinitionStatus = 'idle' | 'saving' | 'success' | 'error';

export interface UpdatePawnDefinitionViewModel {
  readonly status: UpdatePawnDefinitionStatus;
  readonly message: string | null;
}

type ViewModelListener = () => void;

export class UpdatePawnDefinitionPresenter {
  private viewModel: UpdatePawnDefinitionViewModel = { status: 'idle', message: null };
  private readonly listeners = new Set<ViewModelListener>();

  public getViewModel = (): UpdatePawnDefinitionViewModel => this.viewModel;

  public subscribe = (listener: ViewModelListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public presentSaving(): void {
    this.update({ status: 'saving', message: null });
  }

  public presentSuccess(result: UpdatePawnDefinitionResult): void {
    this.update({ status: 'success', message: `Le pion « ${result.id} » a été mis à jour.` });
  }

  public presentError(error: unknown): void {
    const message = error instanceof PawnDefinitionNotFoundError
      ? 'Ce pion est introuvable dans le catalogue.'
      : "La mise à jour du pion a échoué.";
    this.update({ status: 'error', message });
  }

  private update(viewModel: UpdatePawnDefinitionViewModel): void {
    this.viewModel = viewModel;
    this.listeners.forEach((listener) => listener());
  }
}
