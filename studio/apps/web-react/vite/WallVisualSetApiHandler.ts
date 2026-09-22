import { readFile } from 'node:fs/promises';

export class WallVisualSetApiHandler {
  private readonly filePath: string;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async handle(): Promise<readonly { id: string; keyByLevel: Record<string, string> }[]> {
    const content = await readFile(this.filePath, 'utf8');
    return JSON.parse(content) as Array<{ id: string; keyByLevel: Record<string, string> }>;
  }
}
