import type { GameStatsReader, RecordedGame } from '../ports/GameStatsReader.ts';

export class GetRecordedGame {
  private readonly reader: GameStatsReader;

  public constructor(reader: GameStatsReader) {
    this.reader = reader;
  }

  public execute(gameId: string): Promise<RecordedGame> {
    return this.reader.getGame(gameId);
  }
}
