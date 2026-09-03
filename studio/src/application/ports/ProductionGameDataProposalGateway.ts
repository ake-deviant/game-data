import type { ProductionCommanderDocument } from '../models/ProductionCommanderDocument.ts';

export interface ProductionGameDataProposal {
  readonly branchName: string;
}

export interface ProductionGameDataProposalGateway {
  create(commanders: readonly ProductionCommanderDocument[]): Promise<ProductionGameDataProposal>;
}
