export interface ImportServiceContract {
  importFeed(url: string): Promise<unknown>;
}

export interface SyncService {
  synchronize(id: string): Promise<unknown>;
}

export interface ParserService {
  parse(input: string): Promise<unknown>;
}

export interface IProviderResolver {
  resolve(url: string): Promise<unknown>;
}
