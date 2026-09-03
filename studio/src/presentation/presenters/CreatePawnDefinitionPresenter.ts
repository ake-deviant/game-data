import { PawnDefinitionAlreadyExistsError } from '@game-data/application';
import type { CreatePawnDefinitionResult } from '@game-data/application';

export type CreatePawnDefinitionStatus = 'idle' | 'saving' | 'success' | 'error';

export interface CreatePawnDefinitionViewModel {
  readonly status: CreatePawnDefinitionStatus;
  readonly message: string | null;
}

type ViewModelListener = () => void;

export class CreatePawnDefinitionPresenter {
  private viewModel: CreatePawnDefinitionViewModel = { status: 'idle', message: null };
  private readonly listeners = new Set<ViewModelListener>();

  public getViewModel = (): CreatePawnDefinitionViewModel => this.viewModel;

  public subscribe = (listener: ViewModelListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public presentSaving(): void {
    this.update({ status: 'saving', message: null });
  }

  public presentSuccess(result: CreatePawnDefinitionResult): void {
    this.update({
      status: 'success',
      message: `Le pion « ${result.id} » a été ajouté au catalogue.`,
    });
  }

  public presentError(error: unknown): void {
    const message = error instanceof PawnDefinitionAlreadyExistsError
      ? 'Un pion avec cet identifiant existe déjà dans le catalogue.'
      : "Le pion n'a pas pu être ajouté au catalogue.";
    this.update({ status: 'error', message });
  }

  private update(viewModel: CreatePawnDefinitionViewModel): void {
    this.viewModel = viewModel;
    this.listeners.forEach((listener) => listener());
  }
}
