import type { AtomParserIssueDto } from './dto';
import {
  FeedValidationError,
  EntryValidationError,
  LinkValidationError,
  NamespaceValidationError,
} from './errors';

export class AtomValidators {
  public validateRoot(
    rootName: string | undefined,
    namespaceUri: string | undefined,
  ): AtomParserIssueDto[] {
    const issues: AtomParserIssueDto[] = [];

    if (rootName !== 'feed') {
      issues.push(
        this.createIssue(
          new FeedValidationError('Root element must be <feed>.', { stage: 'root-validation' }),
        ),
      );
    }

    if (namespaceUri !== AtomValidators.ATOM_NAMESPACE_URI) {
      issues.push(
        this.createIssue(
          new NamespaceValidationError('Atom namespace is required on root element.', {
            stage: 'namespace-validation',
            context: { namespaceUri },
          }),
        ),
      );
    }

    return issues;
  }

  public validateLink(href: string | undefined, stage: string): AtomParserIssueDto[] {
    if (!href) {
      return [];
    }

    try {
      new URL(href);
      return [];
    } catch {
      return [
        this.createIssue(
          new LinkValidationError('Link href is invalid.', {
            stage,
            context: { href },
          }),
        ),
      ];
    }
  }

  public validateDate(value: string | undefined, fieldName: string): AtomParserIssueDto[] {
    if (!value) {
      return [];
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) {
      return [
        this.createIssue(
          new EntryValidationError(`Unable to parse date for ${fieldName}.`, {
            stage: 'date-validation',
            context: { value: trimmed },
          }),
        ),
      ];
    }

    return [];
  }

  private createIssue(error: Error): AtomParserIssueDto {
    const context = (error as Error & { context?: Record<string, unknown> }).context;
    const line = (error as Error & { line?: number }).line;
    const column = (error as Error & { column?: number }).column;
    const stage = (error as Error & { stage?: string }).stage;

    return {
      code: error.name,
      message: error.message,
      stage: stage ?? 'parser',
      ...(line ? { line } : {}),
      ...(column ? { column } : {}),
      ...(context ? { context } : {}),
    };
  }

  private static readonly ATOM_NAMESPACE_URI = 'http://www.w3.org/2005/Atom';
}
