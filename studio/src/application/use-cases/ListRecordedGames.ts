import type { GameStatsReader, GameStatsFilters, GameStatsPage } from '../ports/GameStatsReader.ts';

export class ListRecordedGames {
  private readonly reader: GameStatsReader;

  public constructor(reader: GameStatsReader) {
    this.reader = reader;
  }

  public execute(filters: GameStatsFilters): Promise<GameStatsPage> {
    return this.reader.listGames(filters);
  }
}
