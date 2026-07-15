export class XmlUtilities {
  public static isWhitespace(value: string): boolean {
    return /^\s*$/.test(value);
  }

  public static normalizeLineBreaks(value: string): string {
    return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  public static createContextSnippet(
    text: string,
    position: number,
    maxLength = 60,
  ): string | undefined {
    const normalized = this.normalizeLineBreaks(text);
    const start = Math.max(0, position - Math.floor(maxLength / 2));
    const end = Math.min(normalized.length, start + maxLength);
    const snippet = normalized.slice(start, end);
    return snippet.length > 0 ? snippet : undefined;
  }

  public static getQualifiedName(prefix: string | undefined, localName: string): string {
    return prefix ? `${prefix}:${localName}` : localName;
  }

  public static isValidName(value: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9._:-]*$/.test(value);
  }
}
