import {
  ChannelValidationError,
  EnclosureValidationError,
  ItemValidationError,
  InvalidRssDocumentError,
  UnsupportedVersionError,
} from './errors';
import type { ParserIssueDto } from './dto';

export class RssValidators {
  public validateRoot(
    elementName: string | undefined,
    version: string | undefined,
    channel: unknown,
  ): ParserIssueDto[] {
    const issues: ParserIssueDto[] = [];

    if (elementName !== 'rss') {
      issues.push(
        this.createIssue(
          new InvalidRssDocumentError('Root element must be <rss>.', { stage: 'root-validation' }),
        ),
      );
    }

    if (!version) {
      issues.push(
        this.createIssue(
          new InvalidRssDocumentError('RSS version attribute is missing.', {
            stage: 'root-validation',
          }),
        ),
      );
    } else if (!this.isSupportedVersion(version)) {
      issues.push(
        this.createIssue(
          new UnsupportedVersionError(`Unsupported RSS version: ${version}.`, {
            stage: 'root-validation',
          }),
        ),
      );
    }

    if (!channel) {
      issues.push(
        this.createIssue(
          new InvalidRssDocumentError('Channel element is required.', { stage: 'root-validation' }),
        ),
      );
    }

    return issues;
  }

  public validateChannelValue(name: string, value: string | undefined): ParserIssueDto[] {
    return [];
  }

  public validateImageUrl(url: string | undefined): ParserIssueDto[] {
    if (!url) {
      return [];
    }

    try {
      new URL(url);
      return [];
    } catch {
      return [
        this.createIssue(
          new ChannelValidationError('Image URL is invalid.', {
            stage: 'channel-validation',
            context: { url },
          }),
        ),
      ];
    }
  }

  public validateItemValue(name: string, value: string | undefined): ParserIssueDto[] {
    return [];
  }

  public validateEnclosure(
    url: string | undefined,
    type: string | undefined,
    length: string | undefined,
  ): ParserIssueDto[] {
    const issues: ParserIssueDto[] = [];

    if (!url) {
      issues.push(
        this.createIssue(
          new EnclosureValidationError('Enclosure URL is required.', {
            stage: 'item-validation',
            context: { type, length },
          }),
        ),
      );
      return issues;
    }

    try {
      new URL(url);
    } catch {
      issues.push(
        this.createIssue(
          new EnclosureValidationError('Enclosure URL is invalid.', {
            stage: 'item-validation',
            context: { url },
          }),
        ),
      );
    }

    if (!type) {
      issues.push(
        this.createIssue(
          new EnclosureValidationError('Enclosure MIME type is required.', {
            stage: 'item-validation',
            context: { url },
          }),
        ),
      );
    }

    if (!length || Number.isNaN(Number(length))) {
      issues.push(
        this.createIssue(
          new EnclosureValidationError('Enclosure length must be numeric.', {
            stage: 'item-validation',
            context: { url, length },
          }),
        ),
      );
    }

    return issues;
  }

  public validateUrl(url: string | undefined, stage: string): ParserIssueDto[] {
    if (!url) {
      return [];
    }

    try {
      new URL(url);
      return [];
    } catch {
      return [
        this.createIssue(
          new ChannelValidationError('URL is invalid.', { stage, context: { url } }),
        ),
      ];
    }
  }

  private isSupportedVersion(version: string): boolean {
    return version === '2.0';
  }

  private createIssue(error: Error): ParserIssueDto {
    const context =
      error instanceof Error && 'context' in error
        ? (error as Error & { context?: Record<string, unknown> }).context
        : undefined;

    return {
      code: error.name,
      message: error.message,
      stage:
        error instanceof Error && 'stage' in error
          ? String((error as Error & { stage?: string }).stage)
          : 'parser',
      ...(context ? { context } : {}),
    };
  }
}
