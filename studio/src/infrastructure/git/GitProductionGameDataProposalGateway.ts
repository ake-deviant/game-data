import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import type {
  ProductionCommanderDocument,
  ProductionGameDataProposal,
  ProductionGameDataProposalGateway,
} from '@game-data/application';

const executeFile = promisify(execFile);

export class GitProductionGameDataProposalGateway implements ProductionGameDataProposalGateway {
  private readonly repositoryPath: string;

  public constructor(repositoryPath: string) {
    this.repositoryPath = repositoryPath;
  }

  public async create(
    commanders: readonly ProductionCommanderDocument[],
  ): Promise<ProductionGameDataProposal> {
    const branchName = `studio/publish-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
    const worktreePath = await mkdtemp(join(tmpdir(), 'game-data-proposal-'));
    let worktreeCreated = false;

    try {
      await this.git(['fetch', 'origin', 'main']);
      await this.git(['worktree', 'add', '-b', branchName, worktreePath, 'origin/main']);
      worktreeCreated = true;

      const catalogPath = join(worktreePath, 'data', 'commanders.json');
      await mkdir(dirname(catalogPath), { recursive: true });
      await writeFile(catalogPath, `${JSON.stringify(commanders, null, 2)}\n`, 'utf8');
      await this.npm(['version', 'patch', '--no-git-tag-version'], worktreePath);
      await this.git([
        '-C',
        worktreePath,
        'add',
        '--',
        'data/commanders.json',
        'package.json',
        'package-lock.json',
      ]);
      await this.git([
        '-C',
        worktreePath,
        '-c',
        'user.name=Game Data Studio',
        '-c',
        'user.email=studio@game-data.local',
        'commit',
        '-m',
        'feat(data): propose production commanders',
      ]);
      await this.git(['-C', worktreePath, 'push', '--set-upstream', 'origin', branchName]);
      return { branchName };
    } finally {
      if (worktreeCreated) {
        await this.git(['worktree', 'remove', '--force', worktreePath]).catch(() => undefined);
      }
      await rm(worktreePath, { recursive: true, force: true });
    }
  }

  private async git(args: readonly string[]): Promise<void> {
    await executeFile('git', args, { cwd: this.repositoryPath });
  }

  private async npm(args: readonly string[], cwd: string): Promise<void> {
    const executable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await executeFile(executable, args, { cwd });
  }
}
