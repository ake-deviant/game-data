import {
  CommanderAlreadyExistsError,
  type CreateCommanderRequest,
  type CreateCommanderResult,
} from '@game-data/application';

export class HttpCreateCommander {
  public async execute(request: CreateCommanderRequest): Promise<CreateCommanderResult> {
    const response = await fetch('/api/catalog/commanders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 409) {
      throw new CommanderAlreadyExistsError(request.id);
    }

    if (!response.ok) {
      throw new Error(`Commander creation failed with status ${response.status}.`);
    }

    return response.json() as Promise<CreateCommanderResult>;
  }
}
