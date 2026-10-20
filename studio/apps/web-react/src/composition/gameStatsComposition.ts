import { ListRecordedGames, GetRecordedGame, CompareBots } from '@game-data/application';
import { GameStatsController, GameStatsPresenter, BotComparisonController, BotComparisonPresenter } from '@game-data/presentation';
import { HttpGameStatsReader } from '../adapters/HttpGameStatsReader';

export function gameStatsComposition() {
  const reader = new HttpGameStatsReader();
  const listGames = new ListRecordedGames(reader);
  const getGame = new GetRecordedGame(reader);
  const compareBots = new CompareBots(reader);

  const statsPresenter = new GameStatsPresenter();
  const statsController = new GameStatsController(listGames, getGame, statsPresenter);

  const comparisonPresenter = new BotComparisonPresenter();
  const comparisonController = new BotComparisonController(compareBots, listGames, comparisonPresenter);

  return { statsController, statsPresenter, comparisonController, comparisonPresenter };
}
