export class SkillId {
  public readonly value: string;

  public constructor(value: string) {
    if (value.trim().length === 0) {
      throw new Error('SkillId.value is required.');
    }

    this.value = value;
  }

  public equals(other: SkillId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
