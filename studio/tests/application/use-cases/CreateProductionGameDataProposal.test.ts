import { describe, expect, it } from 'vitest';
import type { ProductionCommanderDocument } from '../../../src/application/models/ProductionCommanderDocument';
import type { ProductionGameDataProposalGateway } from '../../../src/application/ports/ProductionGameDataProposalGateway';
import { CreateProductionGameDataProposal } from '../../../src/application/use-cases/CreateProductionGameDataProposal';
import { ProductionCommanderCatalogMother } from '../../fixtures/production/ProductionCommanderCatalogMother';

describe('CreateProductionGameDataProposal', () => {
  it('envoie le catalogue validé vers une nouvelle proposition', async () => {
    // Arrange
    const commanders = ProductionCommanderCatalogMother.valid();
    const generator = { execute: async () => commanders };
    const gateway = new InMemoryProductionGameDataProposalGateway();
    const useCase = new CreateProductionGameDataProposal(generator, gateway);

    // Act
    const result = await useCase.execute({ commanderIds: ['commander-1'] });

    // Assert
    expect(gateway.commanders).toEqual(commanders);
    expect(result).toEqual({
      branchName: 'studio/publish-test',
      prepared: [{ id: 'commander-1', name: 'Commander' }],
    });
  });
});

class InMemoryProductionGameDataProposalGateway implements ProductionGameDataProposalGateway {
  public commanders: readonly ProductionCommanderDocument[] = [];

  public async create(
    commanders: readonly ProductionCommanderDocument[],
  ): Promise<{ branchName: string }> {
    this.commanders = commanders;
    return { branchName: 'studio/publish-test' };
  }
}
