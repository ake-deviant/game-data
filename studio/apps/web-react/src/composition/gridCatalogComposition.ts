import { LoadGridCatalog, SelectGridCommander, CreateGrid, PlaceGridPawn, MoveGridPawn, RemoveGridPawn, UpdateGridPawn, PreviewGridPlacement, GenerateGridDocument, SaveGrid, ListSavedGrids, RestoreGrid, DeleteSavedGrid } from '@game-data/application';
import { GridCatalogController, GridCatalogPresenter, GridEditorController, GridEditorPresenter } from '@game-data/presentation';
import { CryptoPlacementIdGenerator } from '../../../../src/infrastructure/browser/CryptoPlacementIdGenerator';
import { HttpSavedGridRepository } from '../adapters/HttpSavedGridRepository';
import { HttpGridCatalogReader } from '../adapters/HttpGridCatalogReader';

export function gridCatalogComposition() {
  const presenter = new GridCatalogPresenter();
  const controller = new GridCatalogController(new LoadGridCatalog(new HttpGridCatalogReader()), new SelectGridCommander(), presenter);
  const editorPresenter = new GridEditorPresenter();
  const place = new PlaceGridPawn(new CryptoPlacementIdGenerator());
  const savedRepository = new HttpSavedGridRepository();
  const editor = new GridEditorController({
    create: new CreateGrid(), place, move: new MoveGridPawn(), remove: new RemoveGridPawn(),
    update: new UpdateGridPawn(), preview: new PreviewGridPlacement(place),
    generateDocument: new GenerateGridDocument(),
    saveGrid: new SaveGrid(savedRepository, new GenerateGridDocument()), listSaved: new ListSavedGrids(savedRepository), restore: new RestoreGrid(), deleteSaved: new DeleteSavedGrid(savedRepository),
  }, editorPresenter);
  presenter.subscribe(() => {
    const model = presenter.getViewModel();
    editor.open(model.selectedCommander, model.pawns);
  });
  void editor.refreshSaved();
  return { controller, presenter, editor, editorPresenter };
}
