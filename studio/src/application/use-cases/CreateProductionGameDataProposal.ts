import type { ProductionGameDataProposalGateway } from '../ports/ProductionGameDataProposalGateway.ts';
import type {
  GenerateProductionGameData,
  GenerateProductionGameDataRequest,
} from './GenerateProductionGameData.ts';

export interface CreateProductionGameDataProposalResult {
  readonly branchName: string;
  readonly prepared: readonly { readonly id: string; readonly name: string }[];
}

export class CreateProductionGameDataProposal {
  private readonly generateProductionGameData: Pick<GenerateProductionGameData, 'execute'>;
  private readonly proposalGateway: ProductionGameDataProposalGateway;

  public constructor(
    generateProductionGameData: Pick<GenerateProductionGameData, 'execute'>,
    proposalGateway: ProductionGameDataProposalGateway,
  ) {
    this.generateProductionGameData = generateProductionGameData;
    this.proposalGateway = proposalGateway;
  }

  public async execute(
    request: GenerateProductionGameDataRequest,
  ): Promise<CreateProductionGameDataProposalResult> {
    const commanders = await this.generateProductionGameData.execute(request);
    const proposal = await this.proposalGateway.create(commanders);
    const requestedIds = new Set(request.commanderIds);
    return {
      branchName: proposal.branchName,
      prepared: commanders
        .filter(({ id }) => requestedIds.has(id))
        .map(({ id, name }) => ({ id, name })),
    };
  }
}
