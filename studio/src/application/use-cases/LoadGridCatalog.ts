import type { GridCatalogReader } from '../ports/GridCatalogReader.ts';

export class LoadGridCatalog {
  private readonly reader: GridCatalogReader;

  public constructor(reader: GridCatalogReader) {
    this.reader = reader;
  }

  public execute() {
    return this.reader.read();
  }
}
