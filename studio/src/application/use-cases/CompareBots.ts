import type { GameStatsReader, BotComparisonResult } from '../ports/GameStatsReader.ts';

export class CompareBots {
  private readonly reader: GameStatsReader;

  public constructor(reader: GameStatsReader) {
    this.reader = reader;
  }

  public execute(botA: string, botB: string): Promise<BotComparisonResult> {
    return this.reader.compareBots(botA, botB);
  }
}
