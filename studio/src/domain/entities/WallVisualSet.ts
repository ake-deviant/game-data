export interface WallVisualSetProps {
  id: string;
  keyByLevel: Record<string, string>;
}

export class WallVisualSet {
  private readonly props: WallVisualSetProps;

  public constructor(props: WallVisualSetProps) {
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get keyByLevel(): Record<string, string> { return this.props.keyByLevel; }
}
