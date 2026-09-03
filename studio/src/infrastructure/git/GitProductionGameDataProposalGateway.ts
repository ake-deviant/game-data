import { execFile } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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

      const internalCatalogPath = 'studio/store/catalog';
      await cp(
        join(this.repositoryPath, internalCatalogPath),
        join(worktreePath, internalCatalogPath),
        { recursive: true },
      );
      await this.bumpPatchVersion(worktreePath);
      await this.git([
        '-C',
        worktreePath,
        'add',
        '--',
        'data/commanders.json',
        internalCatalogPath,
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
      await this.git(['restore', '--source=HEAD', '--worktree', '--', internalCatalogPath]);
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

  private async bumpPatchVersion(worktreePath: string): Promise<void> {
    const packagePath = join(worktreePath, 'package.json');
    const lockPath = join(worktreePath, 'package-lock.json');
    const packageDocument = JSON.parse(await readFile(packagePath, 'utf8')) as {
      version: string;
    };
    const lockDocument = JSON.parse(await readFile(lockPath, 'utf8')) as {
      version: string;
      packages: Record<string, { version?: string }>;
    };
    const versionParts = packageDocument.version.split('.').map(Number);
    if (
      versionParts.length !== 3
      || versionParts.some((part) => !Number.isInteger(part) || part < 0)
    ) {
      throw new Error(`Unsupported package version '${packageDocument.version}'.`);
    }
    const nextVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
    packageDocument.version = nextVersion;
    lockDocument.version = nextVersion;
    lockDocument.packages[''] ??= {};
    lockDocument.packages[''].version = nextVersion;
    await Promise.all([
      writeFile(packagePath, `${JSON.stringify(packageDocument, null, 2)}\n`, 'utf8'),
      writeFile(lockPath, `${JSON.stringify(lockDocument, null, 2)}\n`, 'utf8'),
    ]);
  }
}
