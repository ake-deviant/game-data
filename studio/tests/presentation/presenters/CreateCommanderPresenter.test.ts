import { describe, expect, it } from 'vitest';
import { CommanderAlreadyExistsError } from '@game-data/application';
import { CreateCommanderPresenter } from '../../../src/presentation/presenters/CreateCommanderPresenter';

describe('CreateCommanderPresenter', () => {
  it('construit le ViewModel de succès', () => {
    const presenter = new CreateCommanderPresenter();

    presenter.presentSuccess({ id: 'commander-1', name: 'Commander' });

    expect(presenter.getViewModel()).toEqual({
      status: 'success',
      message: 'Le Commander « Commander » a été ajouté au catalogue interne.',
    });
  });

  it('traduit une erreur de doublon pour la vue', () => {
    const presenter = new CreateCommanderPresenter();

    presenter.presentError(new CommanderAlreadyExistsError('commander-1'));

    expect(presenter.getViewModel()).toEqual({
      status: 'error',
      message: "Un Commander avec cet identifiant existe déjà dans le catalogue interne.",
    });
  });
});
