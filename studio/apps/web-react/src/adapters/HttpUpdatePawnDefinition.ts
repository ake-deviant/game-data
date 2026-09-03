import {
  PawnDefinitionNotFoundError,
  type CreatePawnDefinitionRequest,
  type UpdatePawnDefinitionResult,
} from '@game-data/application';

export class HttpUpdatePawnDefinition {
  public async execute(request: CreatePawnDefinitionRequest): Promise<UpdatePawnDefinitionResult> {
    const response = await fetch('/api/catalog/pawns', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 404) {
      throw new PawnDefinitionNotFoundError(request.id);
    }

    if (!response.ok) {
      throw new Error(`Pawn update failed with status ${response.status}.`);
    }

    return response.json() as Promise<UpdatePawnDefinitionResult>;
  }
}
