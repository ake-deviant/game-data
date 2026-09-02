import type { UpdateCommander, UpdateCommanderResult } from '@game-data/application';
import type { CreateCommanderRequest } from '@game-data/application';
import type { CommanderFormModel } from '../models/CommanderFormModel.ts';

type UpdateCommanderExecutor = Pick<UpdateCommander, 'execute'>;
interface UpdateCommanderOutputPresenter {
  presentSaving(): void;
  presentSuccess(result: UpdateCommanderResult): void;
  presentError(error: unknown): void;
}

export class UpdateCommanderController {
  private readonly updateCommander: UpdateCommanderExecutor;
  private readonly presenter: UpdateCommanderOutputPresenter;

  public constructor(
    updateCommander: UpdateCommanderExecutor,
    presenter: UpdateCommanderOutputPresenter,
  ) {
    this.updateCommander = updateCommander;
    this.presenter = presenter;
  }

  public async submit(form: CommanderFormModel): Promise<void> {
    this.presenter.presentSaving();
    try {
      const result = await this.updateCommander.execute(this.toRequest(form));
      this.presenter.presentSuccess(result);
    } catch (error) {
      this.presenter.presentError(error);
    }
  }

  private toRequest(form: CommanderFormModel): CreateCommanderRequest {
    return {
      id: form.id,
      name: form.name,
      description: form.description || undefined,
      icon: form.icon || undefined,
      pawnMax: form.pawnMax,
      health: form.health,
      maxDefenseLevel: form.maxDefenseLevel,
      wallVisualSet: form.wallVisualSet,
      defensePowerPerLevel: form.defensePowerPerLevel,
      pawnDefinitionIdByColor: form.pawnDefinitionIdByColor,
      commanderPawnDefinitionIds: form.commanderPawnDefinitionIds,
      officerPawnDefinitionIds: form.officerPawnDefinitionIds,
      movementsPerTurn: form.movementsPerTurn,
    };
  }
}
