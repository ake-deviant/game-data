import {
  type CreateCommander,
  type CreateCommanderRequest,
} from '@game-data/application';
import type { CreateCommanderResult } from '@game-data/application';
import type { CommanderFormModel } from '../models/CommanderFormModel.ts';

type CreateCommanderExecutor = Pick<CreateCommander, 'execute'>;
interface CreateCommanderOutputPresenter {
  presentSaving(): void;
  presentSuccess(result: CreateCommanderResult): void;
  presentError(error: unknown): void;
}

export class CreateCommanderController {
  public constructor(
    private readonly createCommander: CreateCommanderExecutor,
    private readonly presenter: CreateCommanderOutputPresenter,
  ) {}

  public async submit(form: CommanderFormModel): Promise<void> {
    this.presenter.presentSaving();

    try {
      const commander = await this.createCommander.execute(this.toRequest(form));
      this.presenter.presentSuccess(commander);
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
      freeRecruitThreshold: form.freeRecruitThreshold,
      skills: form.skills,
      innateSkills: form.innateSkills,
    };
  }
}
