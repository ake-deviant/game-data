import { readFile } from 'node:fs/promises';

export class WallVisualSetApiHandler {
  private readonly filePath: string;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async handle(): Promise<readonly string[]> {
    const content = await readFile(this.filePath, 'utf8');
    const sets = JSON.parse(content) as Array<{ id: string }>;
    return sets.map((s) => s.id);
  }
}
