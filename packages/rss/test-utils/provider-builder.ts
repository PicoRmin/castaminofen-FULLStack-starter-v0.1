import { GenericProvider } from '../src/providers/generic';
import { MockHttpClient, type MockHttpResponseDefinition } from './mock-http-client';
import type { ParserDiagnostics } from '../src/parser/core/types';
import { DefaultParserDiagnostics } from '../src/parser/core/types';

export interface ProviderTestBuilderOptions {
  readonly responses?: readonly MockHttpResponseDefinition[];
  readonly diagnostics?: ParserDiagnostics;
}

export function createProviderHarness(options: ProviderTestBuilderOptions = {}) {
  const diagnostics = options.diagnostics ?? new DefaultParserDiagnostics();
  const downloader = {
    async download(url: string): Promise<string> {
      const response = new MockHttpClient(options.responses ?? []).execute({
        id: 'mock-request',
        method: 'GET',
        url,
        headers: {},
      });
      return (await response).body;
    },
  };

  return new GenericProvider({ downloader, diagnostics });
}
