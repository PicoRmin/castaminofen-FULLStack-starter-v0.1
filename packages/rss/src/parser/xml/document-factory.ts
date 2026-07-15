import { XmlDocument, XmlDeclaration } from './document';
import { XmlEncodingDetector } from './encoding-detector';
import { XmlLoader } from './loader';
import { XmlReader } from './reader';
import { XmlValidator } from './validator';
import type { XmlInput } from './types';

export class XmlDocumentFactory {
  constructor(
    private readonly loader: XmlLoader = new XmlLoader(),
    private readonly detector: XmlEncodingDetector = new XmlEncodingDetector(),
    private readonly validator: XmlValidator = new XmlValidator(),
    private readonly reader: XmlReader = new XmlReader(),
  ) {}

  public async create(input: XmlInput): Promise<XmlDocument> {
    const loadResult = await this.loader.load(input);
    this.detector.detect(Buffer.from(loadResult.text, 'utf8'));
    const validation = this.validator.validate(loadResult.text);
    const document = this.reader.read(loadResult);

    const declaration = this.parseDeclaration(loadResult.text);
    if (document.errors.length === 0) {
      document.declaration = declaration;
    } else {
      document.errors.push(...validation.errors);
    }

    return document;
  }

  private parseDeclaration(text: string): XmlDeclaration | undefined {
    const match = text.match(
      /<\?xml\s+version=["']([^"']+)["'](?:\s+encoding=["']([^"']+)["'])?(?:\s+standalone=["'](yes|no)["'])?\s*\?>/i,
    );
    if (!match || !match[1]) {
      return undefined;
    }

    const version = match[1];
    const encoding = match[2];
    const standalone = match[3];
    return new XmlDeclaration(version, encoding, standalone);
  }
}
