import { CommanderAlreadyExistsError } from '@game-data/application';
import type { CreateCommanderResult } from '@game-data/application';

export type CreateCommanderStatus = 'idle' | 'saving' | 'success' | 'error';

export interface CreateCommanderViewModel {
  readonly status: CreateCommanderStatus;
  readonly message: string | null;
}

type ViewModelListener = () => void;

export class CreateCommanderPresenter {
  private viewModel: CreateCommanderViewModel = {
    status: 'idle',
    message: null,
  };

  private readonly listeners = new Set<ViewModelListener>();

  public getViewModel = (): CreateCommanderViewModel => this.viewModel;

  public subscribe = (listener: ViewModelListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public presentSaving(): void {
    this.update({ status: 'saving', message: null });
  }

  public presentSuccess(result: CreateCommanderResult): void {
    this.update({
      status: 'success',
      message: `Le Commander « ${result.name} » a été ajouté au catalogue interne.`,
    });
  }

  public presentError(error: unknown): void {
    const message = error instanceof CommanderAlreadyExistsError
      ? "Un Commander avec cet identifiant existe déjà dans le catalogue interne."
      : "Le Commander n'a pas pu être ajouté au catalogue interne.";

    this.update({ status: 'error', message });
  }

  private update(viewModel: CreateCommanderViewModel): void {
    this.viewModel = viewModel;
    this.listeners.forEach((listener) => listener());
  }
}
