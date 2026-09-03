import {
  PawnDefinitionAlreadyExistsError,
  type CreatePawnDefinitionRequest,
  type CreatePawnDefinitionResult,
} from '@game-data/application';

export class HttpCreatePawnDefinition {
  public async execute(request: CreatePawnDefinitionRequest): Promise<CreatePawnDefinitionResult> {
    const response = await fetch('/api/catalog/pawns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 409) {
      throw new PawnDefinitionAlreadyExistsError(request.id);
    }

    if (!response.ok) {
      throw new Error(`Pawn creation failed with status ${response.status}.`);
    }

    return response.json() as Promise<CreatePawnDefinitionResult>;
  }
}
