const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ACTION_TAG_OPEN = '<boltAction';
const ACTION_TAG_CLOSE = '</boltAction>';

export interface Action {
  type: 'file' | 'shell';
  filePath?: string;
  content: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: string;
  actions: Action[];
}

export class MessageParser {
  private artifactCounter = 0;

  /**
   * Parses AI responses to extract <boltArtifact> and <boltAction> tags.
   * Surgically extracted from bolt.diy message-parser logic.
   */
  parse(messageId: string, input: string): Artifact[] {
    const artifacts: Artifact[] = [];
    let currentPos = 0;

    while (true) {
      const openIndex = input.indexOf(ARTIFACT_TAG_OPEN, currentPos);
      if (openIndex === -1) break;

      const tagEndIndex = input.indexOf('>', openIndex);
      const closeIndex = input.indexOf(ARTIFACT_TAG_CLOSE, tagEndIndex);
      if (closeIndex === -1) break;

      const artifactTag = input.slice(openIndex, tagEndIndex + 1);
      const artifactId = this.extractAttribute(artifactTag, 'id') || `art-${messageId}-${this.artifactCounter++}`;
      const title = this.extractAttribute(artifactTag, 'title') || 'Artifact';
      const type = this.extractAttribute(artifactTag, 'type') || 'bundled';

      const artifactContent = input.slice(tagEndIndex + 1, closeIndex);
      const actions = this.parseActions(artifactContent);

      artifacts.push({ id: artifactId, title, type, actions });
      currentPos = closeIndex + ARTIFACT_TAG_CLOSE.length;
    }

    return artifacts;
  }

  private parseActions(content: string): Action[] {
    const actions: Action[] = [];
    let currentPos = 0;

    while (true) {
      const openIndex = content.indexOf(ACTION_TAG_OPEN, currentPos);
      if (openIndex === -1) break;

      const tagEndIndex = content.indexOf('>', openIndex);
      const closeIndex = content.indexOf(ACTION_TAG_CLOSE, tagEndIndex);
      if (closeIndex === -1) break;

      const actionTag = content.slice(openIndex, tagEndIndex + 1);
      const type = this.extractAttribute(actionTag, 'type') as 'file' | 'shell';
      const filePath = this.extractAttribute(actionTag, 'filePath');
      const actionContent = content.slice(tagEndIndex + 1, closeIndex).trim();

      actions.push({ type, filePath, content: actionContent });
      currentPos = closeIndex + ACTION_TAG_CLOSE.length;
    }

    return actions;
  }

  private extractAttribute(tag: string, name: string): string | undefined {
    const match = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
    return match ? match[1] : undefined;
  }
}
