import type { GridEditorViewModel } from '../models/GridEditorViewModel.ts';

export class GridEditorPresenter {
  private model: GridEditorViewModel = {
    ready: false, rows: 0, cols: 0, pawns: [], remainingCapacity: 0, pawnMax: 0, powerInput: '', turnCountInput: '', description: '', saving: false, savedGrids: [],
  };
  private readonly listeners = new Set<() => void>();
  public getViewModel = () => this.model;
  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  public present(model: GridEditorViewModel): void {
    this.model = model;
    this.listeners.forEach((listener) => listener());
  }
}
