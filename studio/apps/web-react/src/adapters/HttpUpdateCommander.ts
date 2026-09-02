import {
  CommanderNotFoundError,
  type CreateCommanderRequest,
  type UpdateCommanderResult,
} from '@game-data/application';

export class HttpUpdateCommander {
  public async execute(request: CreateCommanderRequest): Promise<UpdateCommanderResult> {
    const response = await fetch('/api/catalog/commanders', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 404) {
      throw new CommanderNotFoundError(request.id);
    }

    if (!response.ok) {
      throw new Error(`Commander update failed with status ${response.status}.`);
    }

    return response.json() as Promise<UpdateCommanderResult>;
  }
}
