import type { PlacementIdGenerator } from '@game-data/application';

export class CryptoPlacementIdGenerator implements PlacementIdGenerator {
  public generate(): string {
    return globalThis.crypto.randomUUID();
  }
}
