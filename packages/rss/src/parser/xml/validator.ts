import { XmlUtilities } from './utilities';
import { XmlErrorFactory } from './error-factory';
import { XmlSyntaxError, XmlValidationError } from './errors';
import type { XmlValidationResult } from './types';

export class XmlValidator {
  public validate(text: string): XmlValidationResult {
    const errors: XmlValidationError[] = [];
    const normalized = XmlUtilities.normalizeLineBreaks(text);

    if (!normalized.trim()) {
      errors.push(XmlErrorFactory.validation('Empty XML document.'));
      return { valid: false, errors };
    }

    if (!/<\?xml/i.test(normalized)) {
      errors.push(XmlErrorFactory.validation('XML declaration is missing.'));
    }

    const declarationMatch = normalized.match(
      /<\?xml\s+version=["']([^"']+)["'](?:\s+encoding=["']([^"']+)["'])?(?:\s+standalone=["'](yes|no)["'])?\s*\?>/i,
    );
    if (declarationMatch) {
      const version = declarationMatch[1];
      if (version !== '1.0') {
        errors.push(XmlErrorFactory.validation(`Unsupported XML version: ${version}`));
      }
    }

    const rootTagPattern = /<([A-Za-z_][A-Za-z0-9._:-]*)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/;
    if (!rootTagPattern.test(normalized)) {
      errors.push(XmlErrorFactory.validation('Single root node is required.'));
    }

    const tagPattern = /<\/?[A-Za-z_][A-Za-z0-9._:-]*\s*[^>]*>/g;
    const tags = normalized.matchAll(tagPattern);
    const stack: string[] = [];
    for (const match of tags) {
      const token = match[0];
      if (token.startsWith('</')) {
        const name = token.slice(2, -1).trim().split(/\s+/)[0] ?? '';
        if (stack.length === 0 || stack[stack.length - 1] !== name) {
          errors.push(XmlErrorFactory.validation(`Mismatched closing tag: ${name}`));
          break;
        }
        stack.pop();
      } else if (!token.startsWith('<!--') && !token.startsWith('<!')) {
        const name =
          token
            .slice(1, token.length - 1)
            .trim()
            .split(/\s+/)[0] ?? '';
        const normalizedName = name.replace(/\/.*/, '').replace(/\?.*/, '');
        if (!name.startsWith('/') && !token.endsWith('/>')) {
          stack.push(normalizedName);
        }
      }
    }

    if (stack.length > 0) {
      errors.push(XmlErrorFactory.validation('Unclosed tags detected.'));
    }

    const illegalCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
    if (illegalCharacterPattern.test(normalized)) {
      errors.push(XmlErrorFactory.validation('Illegal XML characters detected.'));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
