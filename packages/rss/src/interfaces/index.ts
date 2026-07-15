export interface IRssParser {
  parse(input: string): Promise<unknown>;
}

export interface IRssProvider {
  readonly type: string;
  supports(url: string): boolean;
}

export interface IFeedRepository {
  findById(id: string): Promise<unknown>;
}

export interface IEpisodeRepository {
  findById(id: string): Promise<unknown>;
}

export interface IFeedImporter {
  importFeed(url: string): Promise<unknown>;
}

export interface IFeedSynchronizer {
  synchronize(id: string): Promise<unknown>;
}

export interface IXmlDownloader {
  download(url: string): Promise<string>;
}

export interface ILogger {
  log(message: string): void;
  error(message: string): void;
}

export interface ICache<T = unknown> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

export interface IValidator<T = unknown> {
  validate(input: T): Promise<unknown>;
}
