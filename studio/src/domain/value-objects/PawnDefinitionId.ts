export class PawnDefinitionId {
  public readonly value: string;

  public constructor(value: string) {
    if (value.trim().length === 0) {
      throw new Error('PawnDefinitionId.value is required.');
    }

    this.value = value;
  }

  public equals(other: PawnDefinitionId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
