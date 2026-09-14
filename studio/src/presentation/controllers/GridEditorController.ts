import type { Grid, PlacedPawn } from '@game-data/domain';
import type {
  CreateGrid, GridCommanderItem, GridPawnTemplate, GridPlacementSource, GridPlacementPreview, RestoreGrid, ListSavedGrids,
  PlaceGridPawn, MoveGridPawn, RemoveGridPawn, UpdateGridPawn, PreviewGridPlacement,
} from '@game-data/application';
import type { GridEditorPresenter } from '../presenters/GridEditorPresenter.ts';

export interface GridEditorUseCases {
  readonly create: CreateGrid;
  readonly place: PlaceGridPawn;
  readonly move: MoveGridPawn;
  readonly remove: RemoveGridPawn;
  readonly update: UpdateGridPawn;
  readonly preview: PreviewGridPlacement;
  readonly saveGrid?: import('@game-data/application').SaveGrid;
  readonly listSaved?: ListSavedGrids;
  readonly restore?: RestoreGrid;
}

export class GridEditorController {
  private grid?: Grid;
  private templates: readonly GridPawnTemplate[] = [];
  private source?: GridPlacementSource;
  private selectedId?: string;
  private preview?: GridPlacementPreview;
  private powerInput = '';
  private turnCountInput = '';
  private message?: string;
  private description = '';
  private savedId?: string;
  private saving = false;
  private savedGrids: readonly import('@game-data/application').SavedGridDocument[] = [];
  private activeCommander?: GridCommanderItem;

  public constructor(private readonly useCases: GridEditorUseCases, private readonly presenter: GridEditorPresenter) {}

  public open(commander: GridCommanderItem | undefined, templates: readonly GridPawnTemplate[]): void {
    this.grid = undefined;
    this.templates = templates;
    this.source = undefined;
    this.preview = undefined;
    this.selectedId = undefined;
    this.message = undefined;
    this.description = '';
    this.savedId = undefined;
    this.activeCommander = commander;
    this.powerInput = '';
    this.turnCountInput = '';
    if (commander) {
      this.grid = this.useCases.create.execute({ commanders: [commander], pawns: templates }, commander.id);
    }
    this.publish();
    void this.refreshSaved();
  }

  public async refreshSaved(): Promise<void> {
    if (!this.useCases.listSaved) return;
    try {
      this.savedGrids = await this.useCases.listSaved.execute();
      this.publish();
    }
    catch (error) { this.message = error instanceof Error ? error.message : 'Impossible de charger les grilles enregistrées.'; this.publish(); }
  }

  public restoreSaved(id: string, commander: GridCommanderItem | undefined, templates: readonly GridPawnTemplate[]): void {
    const saved = this.savedGrids.find((item) => item.id === id);
    if (!saved || !commander || !this.useCases.restore) return;
    try {
      const restored = this.useCases.restore.execute({ commanders: [commander], pawns: templates }, saved);
      this.grid = restored.grid; this.templates = templates; this.selectedId = undefined; this.source = undefined;
      this.description = saved.description; this.savedId = saved.id; this.message = 'Grille enregistrée chargée.'; this.publish();
    } catch (error) { this.message = this.errorMessage(error); this.publish(); }
  }

  public chooseTemplate(key: string): void {
    const template = this.templates.find((item) => `${item.role}:${item.id}` === key);
    if (!this.grid || !template) return;
    this.source = { template };
    this.selectedId = undefined;
    this.preview = undefined;
    this.message = undefined;
    this.publish();
  }

  public selectPawn(id: string): void {
    if (!this.grid) return;
    this.select(this.grid.find(id));
    this.source = undefined;
    this.preview = undefined;
    this.message = undefined;
    this.publish();
  }

  public beginMove(id: string): void {
    if (!this.grid) return;
    this.select(this.grid.find(id));
    this.source = { pawnId: id };
    this.preview = undefined;
    this.message = undefined;
    this.publish();
  }

  public hover(col: number, row: number): void {
    if (!this.grid || !this.source) return;
    this.preview = this.useCases.preview.execute(this.grid, this.source, col, row);
    this.publish();
  }

  public leave(): void { this.preview = undefined; this.publish(); }
  public cancel(): void { this.source = undefined; this.preview = undefined; this.publish(); }

  public drop(col: number, row: number): void {
    if (!this.grid || !this.source) return;
    try {
      const pawn = 'template' in this.source
        ? this.useCases.place.execute(this.grid, this.source.template, col, row)
        : this.useCases.move.execute(this.grid, this.source.pawnId, col, row);
      this.select(pawn);
      this.message = undefined;
    } catch (error) { this.message = this.errorMessage(error); }
    this.source = undefined;
    this.preview = undefined;
    this.publish();
  }

  public editPower(value: string): void { this.powerInput = value; this.message = undefined; this.publish(); }
  public editTurnCount(value: string): void { this.turnCountInput = value; this.message = undefined; this.publish(); }

  public save(): void {
    if (!this.grid || !this.selectedId) return;
    try {
      const selected = this.grid.find(this.selectedId);
      const power = this.powerInput.trim() === '' ? NaN : Number(this.powerInput);
      const turns = selected.rank === 'troop' ? null : this.turnCountInput.trim() === '' ? NaN : Number(this.turnCountInput);
      this.select(this.useCases.update.execute(this.grid, this.selectedId, power, turns));
      this.message = 'Valeurs mises à jour.';
    } catch (error) { this.message = this.errorMessage(error); }
    this.publish();
  }

  public remove(): void {
    if (!this.grid || !this.selectedId) return;
    this.useCases.remove.execute(this.grid, this.selectedId);
    this.selectedId = undefined;
    this.source = undefined;
    this.preview = undefined;
    this.powerInput = '';
    this.turnCountInput = '';
    this.message = 'Pion supprimé.';
    this.publish();
  }

  public editDescription(value: string): void { this.description = value; this.publish(); }

  public async saveGrid(): Promise<void> {
    if (!this.grid || !this.useCases.saveGrid) return;
    this.saving = true; this.message = undefined; this.publish();
    try {
      const saved = await this.useCases.saveGrid.execute(this.grid, { id: this.savedId, description: this.description });
      this.savedId = saved.id; this.description = saved.description; this.message = 'Grille enregistrée dans le studio.';
      if (this.useCases.listSaved) this.savedGrids = await this.useCases.listSaved.execute();
    } catch (error) { this.message = this.errorMessage(error); }
    this.saving = false; this.publish();
  }

  private select(pawn: PlacedPawn): void {
    this.selectedId = pawn.id;
    this.powerInput = String(pawn.power);
    this.turnCountInput = pawn.turnCount === null ? '' : String(pawn.turnCount);
  }

  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Opération impossible.'; }

  private publish(): void {
    this.presenter.present({
      ready: !!this.grid, rows: this.grid?.rows ?? 0, cols: this.grid?.cols ?? 0,
      pawns: this.grid?.pawns ?? [], remainingCapacity: this.grid?.remainingCapacity ?? 0, pawnMax: this.grid?.pawnMax ?? 0,
      selectedId: this.selectedId,
      activeTemplateKey: this.source && 'template' in this.source ? `${this.source.template.role}:${this.source.template.id}` : undefined,
      movingId: this.source && 'pawnId' in this.source ? this.source.pawnId : undefined,
      preview: this.preview, powerInput: this.powerInput, turnCountInput: this.turnCountInput, message: this.message,
      description: this.description, savedId: this.savedId, saving: this.saving,
      savedGrids: this.savedGrids,
    });
  }

}
