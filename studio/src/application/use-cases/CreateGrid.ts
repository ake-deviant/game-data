import { Grid } from '@game-data/domain';
import type { GridCatalog } from '../ports/GridCatalogReader.ts';
import { SelectGridCommander } from './SelectGridCommander.ts';

export class CreateGrid {
  public execute(catalog: GridCatalog, commanderId: string): Grid {
    const { commander } = new SelectGridCommander().execute(catalog, commanderId);
    return new Grid(commander);
  }
}
